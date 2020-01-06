const conf = require('ocore/conf.js');
const lightWallet = require('ocore/light_wallet.js');
const myWitnesses = require('ocore/my_witnesses.js');
const async = require('async');
const mutex = require('ocore/mutex.js');
const network = require('ocore/network.js');
const wallet_general = require('ocore/wallet_general.js');
const eventBus = require('ocore/event_bus.js');
const db = require('ocore/db.js');
//const social_networks = require('./social_networks.js');


var assocCurrentQuestions = {};
var assocNicknamesByAddress = {};

const assocNewQuestionsPending = {};
const assocActionsPending = {};

myWitnesses.readMyWitnesses(function (arrWitnesses) {
	if (arrWitnesses.length > 0)
		return start();
	myWitnesses.insertWitnesses(conf.initial_witnesses, start);
}, 'ignore');


function start(){
	lightWallet.setLightVendorHost(conf.hub);
	wallet_general.addWatchedAddress(conf.aa_address, function(error){
		if (error)
			console.log(error)
		else
			console.log(conf.aa_address + " added as watched address")
		refresh();
		indexFromStateVars();
		setInterval(refresh, 60 * 1000);
		eventBus.on('new_my_transactions', treatUnconfirmedEvents);
		eventBus.on('my_transactions_became_stable', discardUnconfirmedEvents);
		eventBus.on('sequence_became_bad', discardUnconfirmedEvents);

	});
}

function refresh(){
	lightWallet.refreshLightClientHistory();
	catchUpOperationsHistory();
}

function indexFromStateVars(){
	getStateVarsForPrefixes(["question_", "nickname_"], function(error, objStateVars){
		if (error)
			return console.log(error);
		indexQuestions(objStateVars);
		indexNicknames(objStateVars);
	});
}

function getStateVarsForPrefixes(arrPrefixes, handle){
	console.log("getStateVarsForPrefixes");
	async.reduce(arrPrefixes, {}, function(memo, item, cb) {
		getStateVarsRangeForPrefix(item, "0", "z", function(error, result ){
			if (error)
				return cb(error);
			else
				return cb(null, Object.assign(memo, result));
			
		});
	}, function(error, result){
		if (error)
			return handle(error);
		else
			return handle(null, result);
	})
}

function getStateVarsRangeForPrefix(prefix, start, end, handle){
	const CHUNK_SIZE = 2000;
	network.requestFromLightVendor('light/get_aa_state_vars', {
		address: conf.aa_address,
		var_prefix_from: prefix + start,
		var_prefix_to: prefix + end,
		limit: CHUNK_SIZE
	}, function(ws, request, objResponse){
		if (objResponse.error)
			return handle(objResponse.error);

		if (Object.keys(objResponse).length >= CHUNK_SIZE){
			const delimiter =  Math.floor((end.charCodeAt(0) - start.charCodeAt(0)) / 2 + start.charCodeAt(0));
			async.parallel([function(cb){
				getStateVarsRange(prefix, start, String.fromCharCode(delimiter), cb)
			},
			function(cb){
				getStateVarsRange(prefix, String.fromCharCode(delimiter +1), end, cb)
			}
			], function(error, results){
				if (error)
					return handle(error);
				else
					return handle(null, {...results[0], ...results[1]});
			})
		} else {
			return handle(null, objResponse);
		}
	});
}


//we push in questions_history all information coming from aa responses
function catchUpOperationsHistory(){
	mutex.lock(["catchUpOperationsHistory"], function(unlock){
		//units table is joined to get trigger unit timestamp
		db.query("SELECT * FROM aa_responses INNER JOIN units ON aa_responses.trigger_unit=units.unit WHERE mci >=(SELECT \n\
			CASE WHEN mci IS NOT NULL THEN MAX(mci) \n\
			ELSE 0 \n\
			END max_mci\n\
			FROM questions_history) AND aa_address=?", [conf.aa_address], function(rows){
			async.eachOf(rows, function(row, index, cb) {

				const objResponse = JSON.parse(row.response).responseVars;
				if(!objResponse)
					return cb();

				var paid_in = 0;
				var paid_out = 0;

				//we analyze the response to sort questions_history by event type
				if (objResponse.new_question){
					var event_type = "new_question";
					paid_in = objResponse.your_stake;
					concerned_address = objResponse.your_address;
				} else if (objResponse.expected_reward){
					var event_type = "initial_stake";
					paid_in = objResponse.your_stake;
					concerned_address = objResponse.your_address;
				} else if (objResponse.your_stake){
					var event_type = "stake";
					paid_in = objResponse.your_stake;
					concerned_address = objResponse.your_address;
				} else if (objResponse.committed_outcome){
					var event_type = "commit";
					paid_out = objResponse.paid_out_amount;
					concerned_address = objResponse.paid_out_address;
				} else if (objResponse.paid_out_amount){
					var event_type = "withdraw";
					paid_out = objResponse.paid_out_amount;
					concerned_address = objResponse.paid_out_address;
				} else if (objResponse.created_pool){
					var event_type = "create_pool";
					paid_in = objResponse.amount;
					concerned_address = objResponse.your_address;
				} else if (objResponse.destroyed_pool){
					var event_type = "destroy_pool";
					paid_out = objResponse.amount;
					concerned_address = objResponse.your_address;
				}
				if (event_type){
					// then the raw response is stored in questions_history alongside with data enabling statistics processing
					var question_id = objResponse.question_id;
					db.query("INSERT "+db.getIgnore()+" INTO questions_history (question_id, paid_in, paid_out, concerned_address, event_type, mci, aa_address, response, trigger_unit,timestamp) VALUES \n\
					(?,?,?,?,?,?,?,?,?,?)",[question_id, paid_in, paid_out, concerned_address,  event_type, row.mci, row.aa_address, JSON.stringify(objResponse), row.trigger_unit, row.timestamp],
					function(result){
						if (result.affectedRows === 1){ // trigger social network notification if the event was newly inserted
						/*	social_networks.notify(
								event_type, 
								assocCurrentQuestions[operation_id], 
								assocNicknamesByAddress[concerned_address] || concerned_address, 
								objResponse
							);*/
						}
						cb();
					});
				} else
					cb();
			}, unlock);
		});
	});
}

//we read state vars to read all past and ongoing questions and sort them in different associative arrays
function indexQuestions(objStateVars){

	extractStakedByKeyAndAddress(objStateVars);

	const operationKeys = extractOperationKeys(objStateVars);
	const assocQuestions = {};

	operationKeys.forEach(function(key){
		const question = {};
		question.reward = Number(objStateVars[key+"_reward"]);
		if (question.reward < conf.min_reward_to_display)
			return;
		question.status = objStateVars[key];
		question.question = objStateVars[key+"_question"];
		question.deadline = objStateVars[key+"_deadline"];
		var outcome = objStateVars[key+"_outcome"];
		question.outcome = outcome;
		question.committed_outcome = objStateVars[key + "_committed_outcome"];
		question.initial_outcome = objStateVars[key + "_initial_outcome"];
		question.staked_on_outcome = Number(objStateVars[key + "_total_staked_on_" + outcome]) || 0;
		question.staked_on_opposite = Number(objStateVars[key + "_total_staked_on_" + (outcome == "yes" ? "no" : "yes") ]) || 0;
		question.countdown_start= Number(objStateVars[key + "_countdown_start"]);
		question.total_staked = Number(objStateVars[key + "_total_staked"]);
		question.question_id = key;
		question.staked_by_address = assocStakedByKeyAndAddress[key];
		appendActionsPending(question);
		assocQuestions[key] = question;
	});

	assocCurrentQuestions = assocQuestions;

}


function appendActionsPending(question){

	question.pendingActions = [];
	for (var key in assocActionsPending){
		if (assocActionsPending[key].question_id === question.question_id)
			question.pendingActions.push(assocActionsPending[key]);
	}
}

function indexNicknames(objStateVars){
	for (var key in objStateVars){
		if (key.indexOf("nickname_") == 0){
			var splitKey = key.split('_');
			assocNicknamesByAddress[splitKey[1]] = objStateVars[key];
		}
	}
}

function extractStakedByKeyAndAddress(objStateVars){
	assocStakedByKeyAndAddress = {};
	for (var key in objStateVars){
		if (key.indexOf("question_") == 0){
		var splitKey = key.split('_');
		 if (splitKey[2] == "total" && splitKey[6] == "by"){
			var address = splitKey[7];
			var outcome = splitKey[5];
			var operation_key = splitKey[0] + '_' + splitKey[1];
			if (!assocStakedByKeyAndAddress[operation_key])
				assocStakedByKeyAndAddress[operation_key] = {};
			if(!assocStakedByKeyAndAddress[operation_key][address])
				assocStakedByKeyAndAddress[operation_key][address] = {};
			assocStakedByKeyAndAddress[operation_key][address][outcome]= objStateVars[key];
		 }
		}
	}
}


function extractOperationKeys(objStateVars){
	const assocOperationKeys = {};
	 for (var key in objStateVars){
		 if (key.indexOf("question_") == 0){
			var splitKey = key.split('_');
			assocOperationKeys[splitKey[0] + '_' + splitKey[1]] = true;
		 }
	 }
	 const operationKeys = [];
	 for (var key in assocOperationKeys){
		operationKeys.push(key);
	 }
	 return operationKeys;
 }


function getNicknameForAddress(address){
	return assocNicknamesByAddress[address];
}


function getCurrentQuestions(){
	return Object.values(assocNewQuestionsPending).concat(Object.values(assocCurrentQuestions)); 
}

function getQuestion(question_id){
	return assocCurrentQuestions[question_id] || null;
}


function treatUnconfirmedEvents(arrUnits){

	db.query("SELECT unit,payload,amount,unit_authors.address FROM messages CROSS JOIN outputs USING(unit) \n\
	CROSS JOIN unit_authors USING(unit) \n\
	WHERE unit IN (?) AND app='data' AND outputs.address=? AND outputs.asset IS NULL GROUP BY messages.unit",
	[arrUnits, conf.aa_address], function(rows){
		rows.forEach(function(row){
			const params = {};
			params.trigger = {};
			params.trigger.data = JSON.parse(row.payload);
			params.trigger.address = row.address;
			params.trigger.outputs = {};
			params.trigger.outputs.base = row.amount;
			params.address = conf.aa_address;
			network.requestFromLightVendor('light/dry_run_aa',params, function(ws, request, arrResponses){
				if (arrResponses.error)
					return console.log(arrResponses.error);
				else {
					treatDryAaResponse(row.unit, arrResponses[0]);
					indexFromStateVars();
				}
			})
		});
	});
}


function treatDryAaResponse(triggerUnit, objResponse){

	if (!objResponse.response || !objResponse.response.responseVars)
		return console.log("no response vars");
	const responseVars = objResponse.response.responseVars;
	const updatedStateVars = objResponse.updatedStateVars;
	if (!updatedStateVars)
		return console.log("no updatedStateVars");
	if (responseVars.new_question){
		const question_id =  responseVars.question_id;
		assocNewQuestionsPending[triggerUnit] = {
			question: responseVars.new_question
		}
		assocNewQuestionsPending[triggerUnit].deadline = Number(updatedStateVars[conf.aa_address][question_id + "_deadline"].value);
		assocNewQuestionsPending[triggerUnit].reward = Number(updatedStateVars[conf.aa_address][question_id + "_reward"].value);
		assocNewQuestionsPending[triggerUnit].is_pending = true;

	} else if (responseVars.reported_outcome){
		assocActionsPending[triggerUnit] = {};
		assocActionsPending[triggerUnit].is_initial = !!responseVars.expected_reward;
		assocActionsPending[triggerUnit].stake = responseVars.your_stake;
		assocActionsPending[triggerUnit].staker = responseVars.your_address;
		assocActionsPending[triggerUnit].reported_outcome = responseVars.reported_outcome;
		assocActionsPending[triggerUnit].question_id = responseVars.question_id;
		assocActionsPending[triggerUnit].new_outcome = responseVars.new_outcome;

	} else if (responseVars.committed_outcome){
		assocActionsPending[triggerUnit] = {};
		assocActionsPending[triggerUnit].committed_outcome = responseVars.committed_outcome;
		assocActionsPending[triggerUnit].question_id = responseVars.question_id;
	} else if (responseVars.paid_out_amount){
		assocActionsPending[triggerUnit] = {};
		assocActionsPending[triggerUnit].paid_out_amount = responseVars.paid_out_amount;
		assocActionsPending[triggerUnit].paid_out_address = responseVars.paid_out_address;
	}
 
}

function discardUnconfirmedEvents(arrUnits){
	arrUnits.forEach(function(unit){
		delete assocNewQuestionsPending[unit];
		delete assocActionsPending[unit];
	});
	indexFromStateVars();
}


function getLastTransactionsToAA(handle){

	db.query("SELECT is_stable,payload,units.unit,timestamp FROM units INNER JOIN outputs USING(unit) INNER JOIN messages USING(unit) WHERE outputs.address=? ORDER BY main_chain_index DESC",[conf.aa_address],
	function(rows){
		var results = [];
		rows.forEach(function(row){
			if (!row.payload)
				return null;
			const payload = JSON.parse(row.payload);
			if	(payload.withdraw)
				return results.push({type:"withdrawal", unit: row.unit,timestamp: row.timestamp, is_stable: row.is_stable});
			if	(payload.commit)
				return results.push({type:"commit", unit: row.unit,timestamp: row.timestamp, is_stable: row.is_stable});
			if	(payload.add_wallet_id)
				return results.push({type:"add", unit: row.unit,timestamp: row.timestamp, is_stable: row.is_stable});
			if	(payload.remove_wallet_id)
				return results.push({type:"remove", unit: row.unit,timestamp: row.timestamp, is_stable: row.is_stable});
			if	(payload.reward_amount)
				return results.push({type:"donate", unit: row.unit,timestamp: row.timestamp, is_stable: row.is_stable});
		});
		return handle(results);
	});
}

function getQuestionHistory(id, handle){
	db.query("SELECT event_type,timestamp,response FROM questions_history WHERE question_id=? ORDER BY mci DESC",[id], function(rows){
		return handle(
			rows.map(function(row){
				var objResponse = JSON.parse(row.response);
				if (assocNicknamesByAddress[objResponse.your_address])
					objResponse.nickname = assocNicknamesByAddress[objResponse.your_address];
				return {event_type: row.event_type, response: objResponse, timestamp: row.timestamp};
			})
		)
	});
}


function getContributorsRanking(handle){
	db.query("SELECT CASE WHEN initiatives IS NOT NULL THEN initiatives \n\
	ELSE 0 \n\
	END initiatives,\n\
	CASE WHEN successes IS NOT NULL THEN successes \n\
	ELSE 0 \n\
	END successes,\n\
	income,s1.address FROM\n\
	(SELECT concerned_address AS address FROM operations_history GROUP BY address)s1 \n\
	LEFT JOIN\n\
	(SELECT COUNT(*) AS successes, concerned_address AS address FROM operations_history WHERE event_type='commit' GROUP BY address)s2 USING (address) \n\
	LEFT JOIN\n\
	(SELECT COUNT(*) AS initiatives, concerned_address AS address FROM operations_history WHERE event_type='initial_stake' GROUP BY address)s3 USING (address) \n\
	LEFT JOIN\n\
	(SELECT (SUM(paid_out) - SUM(paid_in)) as income, concerned_address AS address FROM operations_history \n\
	WHERE (event_type='initial_stake' OR event_type='stake' OR event_type='withdraw' OR event_type='commit') GROUP BY address)s4 USING (address)",
	function(rows){
		rows.forEach(function(row){
			if (assocNicknamesByAddress[row.address])
				row.nickname = assocNicknamesByAddress[row.address];
		})
		handle(rows);
	});
}

function getDonatorsRanking(handle){
	db.query("SELECT (SUM(paid_in) - SUM(paid_out)) as amount, concerned_address AS address FROM operations_history \n\
	WHERE (event_type='create_pool' OR event_type='destroyed_pool') \n\
	GROUP BY concerned_address",function(rows){
		rows.forEach(function(row){
			if (assocNicknamesByAddress[row.address])
				row.nickname = assocNicknamesByAddress[row.address];
		})
		handle(rows);
	});
}

exports.getCurrentQuestions = getCurrentQuestions;
exports.getQuestion = getQuestion;
exports.getLastTransactionsToAA = getLastTransactionsToAA;
exports.getQuestionHistory = getQuestionHistory;
exports.getContributorsRanking = getContributorsRanking;
exports.getDonatorsRanking = getDonatorsRanking;
exports.getNicknameForAddress = getNicknameForAddress;
