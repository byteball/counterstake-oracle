const conf = require('ocore/conf.js');
const lightWallet = require('ocore/light_wallet.js');
const myWitnesses = require('ocore/my_witnesses.js');
const async = require('async');
const mutex = require('ocore/mutex.js');
const network = require('ocore/network.js');
const wallet_general = require('ocore/wallet_general.js');
const eventBus = require('ocore/event_bus.js');
const db = require('ocore/db.js');
const storage = require('ocore/storage.js');
const aa_composer = require('ocore/aa_composer.js');

//const social_networks = require('./social_networks.js');

const MAX_QUESTIONS = 200;

var assocAllQuestions = {};
var assocNicknamesByAddress = {};

const assocUnconfirmedQuestions = {};
const assocUnconfirmedEvents = {};

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
		indexFromStateVars(updateOperationsHistory);
		setInterval(refresh, 60 * 1000);
		eventBus.on('new_my_transactions', treatUnconfirmedEvents);
		eventBus.on('my_transactions_became_stable', discardUnconfirmedEventsAndUpdate);
		eventBus.on('sequence_became_bad', discardUnconfirmedEventsAndUpdate);

	});
}

function refresh(){
	lightWallet.refreshLightClientHistory();
}

function indexFromStateVars(handle){
	if (!handle)
	handle = ()=>{};
	getStateVarsForPrefixes(["question_", "nickname_"], function(error, objStateVars){
		if (error)
			return console.log(error);
		purgeUnconfirmedEvents(function(){
			indexQuestions(objStateVars);
			indexNicknames(objStateVars);
			handle();	
		});
	});
}

function getStateVarsForPrefixes(arrPrefixes, handle){
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


function parseEvent(trigger, objResponse){

	const objEvent = {};
	objEvent.event_data = {};
	objEvent.paid_in = 0;
	objEvent.paid_out = 0;
	objEvent.question_id = objResponse.question_id;
	//we analyze the response to sort questions_history by event type
	if (objResponse.new_question){
		objEvent.event_type = "new_question";
		objEvent.paid_in = objResponse.your_stake;
		objEvent.concerned_address = trigger.address;
	} else if (objResponse.resulting_outcome){
		objEvent.event_type = objResponse.expected_reward ? "initial_stake" : "stake";
		objEvent.paid_in = objResponse.accepted_amount;
		objEvent.concerned_address = trigger.address;
		objEvent.event_data.staked_on_yes = objResponse.total_staked_on_yes || 0;
		objEvent.event_data.staked_on_no = objResponse.total_staked_on_no || 0;
		objEvent.event_data.reported_outcome = objResponse.reported_outcome;
		objEvent.event_data.resulting_outcome = objResponse.resulting_outcome;

	} else if (objResponse.committed_outcome){
		objEvent.event_type = "commit";
		objEvent.paid_out = objResponse.paid_out_amount;
		objEvent.concerned_address = objResponse.paid_out_address;
		objEvent.event_data.author = trigger.address;
	} else if (objResponse.paid_out_amount){
		objEvent.event_type = "withdraw";
		objEvent.paid_out = objResponse.paid_out_amount;
		objEvent.concerned_address = objResponse.paid_out_address;
	}
	return objEvent;
}


//we push in questions_history all information coming from aa responses
function updateOperationsHistory(){
	mutex.lock(["updateOperationsHistory"], function(unlock){
		//units table is joined to get trigger unit timestamp
		db.query("SELECT * FROM aa_responses INNER JOIN units ON aa_responses.trigger_unit=units.unit WHERE mci >=(SELECT \n\
			CASE WHEN mci IS NOT NULL THEN MAX(mci) \n\
			ELSE 0 \n\
			END max_mci\n\
			FROM questions_history) AND aa_address=?", [conf.aa_address], function(rows){
			async.eachOf(rows, function(row, index, cb) {
					storage.readJoint(db, row.trigger_unit, {
					ifNotFound: function(){
						throw Error("bad unit not found: "+unit);
					},
					ifFound: function(objJoint){
						const trigger = aa_composer.getTrigger(objJoint.unit, conf.aa_address);
						const objResponse = JSON.parse(row.response).responseVars;
						if(!objResponse)
							return cb();

						const objEvent = parseEvent(trigger, objResponse);

						if (objEvent.event_type){
							// then the raw response is stored in questions_history alongside with data enabling statistics processing
							db.query("INSERT "+db.getIgnore()+" INTO questions_history (question_id, paid_in, paid_out, concerned_address, event_type, mci, aa_address, event_data, trigger_unit,timestamp) VALUES \n\
							(?,?,?,?,?,?,?,?,?,?)",[objEvent.question_id, objEvent.paid_in, objEvent.paid_out, objEvent.concerned_address,  objEvent.event_type, row.mci, row.aa_address, JSON.stringify(objEvent.event_data), row.trigger_unit, row.timestamp],
							function(result){
								if (result.affectedRows === 1){ // trigger social network notification if the event was newly inserted
								/*	social_networks.notify(
										event_type, 
										assocAllQuestions[operation_id], 
										assocNicknamesByAddress[concerned_address] || concerned_address, 
										objResponse
									);*/
								}
								cb();
							});
						} else
							cb();
				}
			})
			}, unlock);
		});
	});
}

//we read state vars to read all past and ongoing questions and sort them in different associative arrays
function indexQuestions(objStateVars){

	extractStakedByKeyAndAddress(objStateVars);

	const operationKeys = extractOperationKeys(objStateVars);
	const arrQuestions = [];
	const assocQuestions = {};

	operationKeys.forEach(function(key){
		const question = {};
		question.reward = Number(objStateVars[key+"_reward"]);
		if (question.reward < conf.min_reward_to_display)
			return;
		question.status = objStateVars[key];
		question.question = objStateVars[key+"_question"];
		question.description = objStateVars[key + "_description"];
		question.deadline = Number(objStateVars[key+"_deadline"]);
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
		appendUnconfirmedEvents(question);
		arrQuestions.push(question)
	});

	arrQuestions.sort(function(a, b) { 
		var time_a = a.status == 'created' ? a.deadline : a.countdown_start;
		var time_b = b.status == 'created' ? b.deadline : b.countdown_start;
		return time_b - time_a;
	});

	arrQuestions.slice(0, MAX_QUESTIONS).forEach(function(question){
		assocQuestions[question.question_id] = question; // we limit assocAllQuestions size, so client receive only last ones 
	});

	arrQuestions.slice(MAX_QUESTIONS).forEach(function(question) { // anyway we must send any question that is being graded
		if (question.status == 'being_graded')
			assocQuestions[question.question_id] = question;
	});

	assocAllQuestions = assocQuestions;
}


function appendUnconfirmedEvents(question){
	question.unconfirmedEvents = [];
	for (var key in assocUnconfirmedEvents){
		if (assocUnconfirmedEvents[key].question_id === question.question_id)
			question.unconfirmedEvents.push(assocUnconfirmedEvents[key]);
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
	return Object.values(assocUnconfirmedQuestions).concat(Object.values(assocAllQuestions)); 
}

function getQuestion(question_id){
	return assocAllQuestions[question_id] || null;
}


function treatUnconfirmedEvents(arrUnits){

	db.query("SELECT units.unit,payload,amount,unit_authors.address,units.timestamp FROM messages CROSS JOIN outputs USING(unit) \n\
	CROSS JOIN unit_authors USING(unit) \n\
	CROSS JOIN units USING(unit) \n\
	WHERE unit IN (?) AND app='data' AND outputs.address=? AND outputs.asset IS NULL GROUP BY messages.unit",
	[arrUnits, conf.aa_address], function(rows){
		rows.forEach(function(row){
			const params = {};
			params.trigger = {};
			params.trigger.data = JSON.parse(row.payload);
			params.trigger.address = row.address;
			params.trigger.timestamp = row.timestamp;
			params.trigger.outputs = {};
			params.trigger.outputs.base = row.amount;
			params.address = conf.aa_address;
			network.requestFromLightVendor('light/dry_run_aa',params, function(ws, request, arrResponses){
				if (arrResponses.error)
					return console.log(arrResponses.error);
				else {
					treatDryAaResponse(row.unit, params.trigger, arrResponses[0]);
					indexFromStateVars(updateOperationsHistory);
				}
			})
		});
	});
}


function treatDryAaResponse(triggerUnit, trigger, objResponse){

	if (!objResponse.response || !objResponse.response.responseVars)
		return console.log("no response vars");
	const responseVars = objResponse.response.responseVars;

	if (responseVars.new_question){
		const updatedStateVars = objResponse.updatedStateVars;
		if (!updatedStateVars)
		return console.log("no updatedStateVars");
		const question_id =  responseVars.question_id;
		assocUnconfirmedQuestions[triggerUnit] = {
			question: responseVars.new_question,
			deadline : Number(updatedStateVars[conf.aa_address][question_id + "_deadline"].value),
			reward : Number(updatedStateVars[conf.aa_address][question_id + "_reward"].value),
			is_pending : true
		}
	} 

	assocUnconfirmedEvents[triggerUnit] = parseEvent(trigger, objResponse.response.responseVars);
	assocUnconfirmedEvents[triggerUnit].trigger_unit = triggerUnit;
	assocUnconfirmedEvents[triggerUnit].timestamp = trigger.timestamp;

}


// returns all unconfirmed events and some last confirmed events
function getLastEvents(handle){
	db.query("SELECT event_type,timestamp,event_data,paid_in,paid_out,concerned_address,trigger_unit,question_id FROM questions_history ORDER BY mci DESC LIMIT 20",
	 function(rows){
		const confirmed_events = rows.map(function(row){
			var objEventData = JSON.parse(row.event_data);
			objEventData.author_nickname = assocNicknamesByAddress[objEventData.author] || null;

			return {
				event_data: objEventData, 
				timestamp: row.timestamp, 
				paid_in: row.paid_in,
				paid_out: row.paid_out,
				concerned_address: row.concerned_address,
				event_type: row.event_type,
				trigger_unit: row.trigger_unit,
				is_confirmed: true,
				question_id: row.question_id,
				question: assocAllQuestions[row.question_id] || null,
				nickname:  assocNicknamesByAddress[row.concerned_address] || null
			};
		})
		const unconfirmed_events = Object.values(assocUnconfirmedEvents)
		unconfirmed_events.forEach((event)=>{
			event.question = assocAllQuestions[event.operation_id] || null;
			event.nickname = assocNicknamesByAddress[event.concerned_address] || null;
		});
		const allEvents = confirmed_events.concat(unconfirmed_events).sort(function(a, b){
			return a.timestamp - b.timestamp;
		});
		return handle(allEvents);
	})
}



function discardUnconfirmedEventsAndUpdate(arrUnits){
	arrUnits.forEach(function(unit){
		delete assocUnconfirmedQuestions[unit];
		delete assocUnconfirmedEvents[unit];
	});
	indexFromStateVars(updateOperationsHistory);
}

// we purge unconfirmed events that are now stable from the hub point of view, so we won't show unconfirmed events 
// that were actually taken into account in state vars
// to do: update questions history from there as well
function purgeUnconfirmedEvents(handle){
	network.requestFromLightVendor('light/get_aa_responses', {aas: [conf.aa_address]}, function(ws, request, response){
		if (!Array.isArray(response)){
			console.log("light/get_aa_responses didn't return an array");
			return handle();
		}
		response.forEach(function(row){
			delete assocUnconfirmedEvents[row.trigger_unit];
			delete assocUnconfirmedQuestions[row.trigger_unit];
		})
		return handle();
	});
}


function getQuestionHistory(id, handle){
	db.query("SELECT event_type,timestamp,event_data,paid_in,paid_out,concerned_address,trigger_unit FROM questions_history WHERE question_id=? ORDER BY mci DESC",[id], function(rows){
		return handle(
			rows.map(function(row){
				var objEventData = JSON.parse(row.event_data);
				const nickname = assocNicknamesByAddress[row.concerned_address] || null;
				return {
					event_type: row.event_type, 
					event_data: objEventData, 
					timestamp: row.timestamp, 
					paid_out: row.paid_out,
					paid_in: row.paid_in,
					concerned_address: row.concerned_address,
					unit: row.trigger_unit,
					nickname
				};
			})
		)
	});
}


exports.getCurrentQuestions = getCurrentQuestions;
exports.getQuestion = getQuestion;
exports.getQuestionHistory = getQuestionHistory;
exports.getNicknameForAddress = getNicknameForAddress;
exports.getLastEvents = getLastEvents;