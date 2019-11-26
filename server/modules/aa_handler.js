const conf = require('ocore/conf.js');
const lightWallet = require('ocore/light_wallet.js');
const myWitnesses = require('ocore/my_witnesses.js');
const async = require('async');
const mutex = require('ocore/mutex.js');
const network = require('ocore/network.js');
const db = require('ocore/db.js');
//const social_networks = require('./social_networks.js');

const exchanges = require('./exchanges.js')


var assocCurrentQuestions = {};
var assocNicknamesByAddress = {};

myWitnesses.readMyWitnesses(function (arrWitnesses) {
	if (arrWitnesses.length > 0)
		return start();
	myWitnesses.insertWitnesses(conf.initial_witnesses, start);
}, 'ignore');


function start(){
	lightWallet.setLightVendorHost(conf.hub);
	db.query("INSERT "+db.getIgnore()+" INTO my_watched_addresses (address) VALUES (?)", [conf.aa_address], function(){
		network.addLightWatchedAddress(conf.address);
		refresh(),
		setInterval(refresh, 60 * 1000);
	});
}

function refresh(){
	lightWallet.refreshLightClientHistory();
	catchUpOperationsHistory();
	network.requestFromLightVendor('light/get_aa_state_vars', {address: conf.aa_address},function(error, request, objStateVars){
		indexQuestions(objStateVars);
		indexNicknames(objStateVars);
	});
}

//we push in an indexed table all information coming from aa responses
function catchUpOperationsHistory(){
/*	mutex.lock(["catchUpOperationsHistory"], function(unlock){
		//units table is joined to get trigger unit timestamp
		db.query("SELECT * FROM aa_responses INNER JOIN units ON aa_responses.trigger_unit=units.unit WHERE mci >=(SELECT \n\
			CASE WHEN mci IS NOT NULL THEN MAX(mci) \n\
			ELSE 0 \n\
			END max_mci\n\
			FROM operations_history) AND aa_address=?", [conf.aa_address], function(rows){
				async.eachOf(rows, function(row, index, cb) {

				const objResponse = JSON.parse(row.response).responseVars;
				if(!objResponse)
					return cb();

				var paid_in = 0;
				var paid_out = 0;
				if (objResponse.expected_reward){
					var operation_type = "initial_stake";
					paid_in = objResponse.your_stake;
					concerned_address = objResponse.your_address;
				} else if (objResponse.your_stake){
					var operation_type = "stake";
					paid_in = objResponse.your_stake;
					concerned_address = objResponse.your_address;
				} else if (objResponse.committed_outcome){
					var operation_type = "commit";
					paid_out = objResponse.paid_out_amount;
					concerned_address = objResponse.paid_out_address;
				} else if (objResponse.paid_out_amount){
					var operation_type = "withdraw";
					paid_out = objResponse.paid_out_amount;
					concerned_address = objResponse.paid_out_address;
				} else if (objResponse.created_pool){
					var operation_type = "create_pool";
					paid_in = objResponse.amount;
					concerned_address = objResponse.your_address;
				} else if (objResponse.destroyed_pool){
					var operation_type = "destroy_pool";
					paid_out = objResponse.amount;
					concerned_address = objResponse.your_address;
				}
				if (operation_type){
					var operation_id = objResponse.operation_id;
					var pair = objResponse.pair;
					db.query("INSERT "+db.getIgnore()+" INTO operations_history (operation_id, paid_in, paid_out, concerned_address, pair, operation_type, mci, aa_address, response, trigger_unit,timestamp) VALUES \n\
					(?,?,?,?,?,?,?,?,?,?,?)",[operation_id, paid_in, paid_out, concerned_address, pair, operation_type, row.mci, row.aa_address, JSON.stringify(objResponse), row.trigger_unit, row.timestamp],
					function(result){
						if (result.affectedRows === 1){
							objResponse.exchange = exchanges.getExchangeName[objResponse.exchange];
							social_networks.notify(
								operation_type, 
								assocCurrentQuestions[operation_id], 
								assocNicknamesByAddress[concerned_address] || concerned_address, 
								objResponse
							);
						}
						cb();
					});
				} else
					cb();
			}, unlock);
		});
	});*/
}

//we read state vars to read all past and ongoing questions and sort them in different associative arrays
function indexQuestions(objStateVars){

	extractStakedByKeyAndAddress(objStateVars);
	extractProofUrls(objStateVars);
	
	const operationKeys = extractOperationKeys(objStateVars);
	const assocOperations = {};
	const assocOperationsByExchange = {};
	const assocWalletIdsByExchange = {};
	const assocExchangeByWalletId = {};

	operationKeys.forEach(function(key){
		const operation = {};
		operation.status = objStateVars[key];
		const pairKey = convertOperationKeyToPairKey(key);
		const exchange = objStateVars[pairKey + "_exchange"];
		const wallet_id = objStateVars[pairKey + "_wallet_id"];
		operation.exchange = exchange;

		operation.wallet_id = wallet_id;

		if(!assocWalletIdsByExchange[exchange])
			assocWalletIdsByExchange[exchange] = [];
		if (objStateVars[pairKey + "_committed_outcome"] == "in") {
			if (assocWalletIdsByExchange[exchange].indexOf(wallet_id) === -1)
				assocWalletIdsByExchange[exchange].push(wallet_id);
			assocExchangeByWalletId[wallet_id] = exchange;
		}
		const outcome = objStateVars[key + "_outcome"]
		operation.outcome = outcome;
		operation.committed_outcome = objStateVars[pairKey + "_committed_outcome"];
		operation.initial_outcome = objStateVars[key + "_initial_outcome"];
		operation.staked_on_outcome = Number(objStateVars[key + "_total_staked_on_" + outcome]);
		operation.staked_on_opposite = Number(objStateVars[key + "_total_staked_on_" + (outcome == "in" ? "out" :"in") ]);
		operation.countdown_start= objStateVars[key + "_countdown_start"];
		operation.total_staked = Number(objStateVars[key + "_total_staked"]);
		operation.pool_id = Number(objStateVars[key + "_pool_id"]);
		operation.key = key;
		operation.staked_by_address = assocStakedByKeyAndAddress[key];
		operation.url_proofs_by_outcome = assocProofsByKeyAndOutcome[key]

		assocOperations[key] = operation;
		if(!assocOperationsByExchange[operation.exchange])
			assocOperationsByExchange[operation.exchange] = [];
		assocOperationsByExchange[operation.exchange].push(operation);
	});

	assocCurrentQuestions = assocOperations;
	assocCurrentExchangeByWalletId = assocExchangeByWalletId;
	assocCurrentQuestionsByExchange = assocOperationsByExchange;
	exchanges.setWalletIdsByExchange(assocWalletIdsByExchange);;

}


function extractProofUrls(objStateVars){
	assocProofsByKeyAndOutcome= {};
	for (var key in objStateVars){
		if (key.indexOf("k_") == 0){
		var splitKey = key.split('_');
		 if (splitKey[4] == "url" && splitKey[5] == "proof"){
			var outcome = splitKey[7];
			var operation_key = splitKey[0] + '_' + splitKey[1] + '_' + splitKey[2] + '_' + splitKey[3];
			if (!assocProofsByKeyAndOutcome[operation_key])
				assocProofsByKeyAndOutcome[operation_key] = {};
			if(!assocProofsByKeyAndOutcome[operation_key][outcome])
				assocProofsByKeyAndOutcome[operation_key][outcome] = [];
			assocProofsByKeyAndOutcome[operation_key][outcome].push(objStateVars[key]);
		 }
		}
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
		if (key.indexOf("k_") == 0){
		var splitKey = key.split('_');
		 if (splitKey[3] == "total" && splitKey[7] == "by"){
			var address = splitKey[9];
			var outcome = splitKey[7];
			var operation_key = splitKey[0] + '_' + splitKey[1] + '_' + splitKey[2] + '_' + splitKey[3];
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
		 if (key.indexOf("k_") == 0){
			var splitKey = key.split('_');
			assocOperationKeys[splitKey[0] + '_' + splitKey[1] + '_' + splitKey[2] + '_' + splitKey[3]] = true;
		 }
	 }
	 const operationKeys = [];
	 for (var key in assocOperationKeys){
		operationKeys.push(key);
	 }
	 return operationKeys;
 }


function convertOperationKeyToPairKey(operationKey){
	var splitKey = operationKey.split('_');
	return 	"p" + "_" + splitKey[1] + "_" + splitKey[2];
}


function extractPoolKeys(objStateVars){
	const assocPoolKeys = {};
	 for (var key in objStateVars){
		 if (key != "pool_id" && key.indexOf("pool_") == 0){
			assocPoolKeys[key.slice(0, 6)] = true;
		 }
	 }
 
	 const poolKeys = [];
	 for (var key in assocPoolKeys){
		poolKeys.push(key);
	 }
	 return poolKeys;
}
 
function getNicknameForAddress(address){
	return assocNicknamesByAddress[address];
}

function getCurrentPools(){
	return currentActivePools;
}

function getCurrentOperations(){
	return Object.values(assocCurrentQuestions);
}

function getCurrentOperationsForExchange(exchange){
	return assocCurrentQuestionsByExchange[exchange] || [];
}

function getCurrentExchangeByWalletId(wallet_id){
	return assocCurrentExchangeByWalletId[wallet_id];
}

function getBestPoolForExchange(exchange){
	var bestPool = {
		reward_amount: 0
	};
	for (var key in assocCurrentPoolsByExchange[exchange]){
		if (assocCurrentPoolsByExchange[exchange][key].reward_amount > bestPool.reward_amount)
		bestPool = assocCurrentPoolsByExchange[exchange][key];
	}

	for (var key in assocCurrentPoolsByExchange["any"]){
		if (assocCurrentPoolsByExchange["any"][key].reward_amount > bestPool.reward_amount)
		bestPool = assocCurrentPoolsByExchange["any"][key];
	}
	return bestPool;
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

function getOperationHistory(id, handle){
	db.query("SELECT operation_type,timestamp,response FROM operations_history WHERE operation_id=? ORDER BY mci DESC",[id], function(rows){
		return handle(
			rows.map(function(row){
				var objResponse = JSON.parse(row.response);
				if (assocNicknamesByAddress[objResponse.your_address])
					objResponse.nickname = assocNicknamesByAddress[objResponse.your_address];
				return {operation_type: row.operation_type, response: objResponse, timestamp: row.timestamp};
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
	(SELECT COUNT(*) AS successes, concerned_address AS address FROM operations_history WHERE operation_type='commit' GROUP BY address)s2 USING (address) \n\
	LEFT JOIN\n\
	(SELECT COUNT(*) AS initiatives, concerned_address AS address FROM operations_history WHERE operation_type='initial_stake' GROUP BY address)s3 USING (address) \n\
	LEFT JOIN\n\
	(SELECT (SUM(paid_out) - SUM(paid_in)) as income, concerned_address AS address FROM operations_history \n\
	WHERE (operation_type='initial_stake' OR operation_type='stake' OR operation_type='withdraw' OR operation_type='commit') GROUP BY address)s4 USING (address)",
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
	WHERE (operation_type='create_pool' OR operation_type='destroyed_pool') \n\
	GROUP BY concerned_address",function(rows){
		rows.forEach(function(row){
			if (assocNicknamesByAddress[row.address])
				row.nickname = assocNicknamesByAddress[row.address];
		})
		handle(rows);
	});
}

function getContributorsGreeting(handle){
	db.query("SELECT operation_id,timestamp,response FROM operations_history WHERE operation_type='commit' ORDER BY mci DESC LIMIT 50", function(rows){
		var arrGreetings = [];
		for (var i = 0; i < rows.length; i++){
			var objResponse = rows[i].response ? JSON.parse(rows[i].response) : null;
			var objOperation = assocCurrentQuestions[rows[i].operation_id];
			if (objResponse && objOperation && objResponse.committed_outcome == objOperation.initial_outcome){
				var sponsorAddress = assocCurrentPoolsById[objOperation.pool_id] ? assocCurrentPoolsById[objOperation.pool_id].sponsor : null;
				arrGreetings.push({
					author:assocNicknamesByAddress[objResponse.paid_out_address] || objResponse.paid_out_address,
					exchange: objOperation.exchange, 
					outcome: objOperation.initial_outcome, 
					sponsor: assocNicknamesByAddress[sponsorAddress] || sponsorAddress
				});
			}
		}
		handle(arrGreetings);
	});
}

exports.getCurrentPools = getCurrentPools;
exports.getCurrentOperations = getCurrentOperations;
exports.getCurrentOperationsForExchange = getCurrentOperationsForExchange;
exports.getBestPoolForExchange = getBestPoolForExchange;
exports.getCurrentExchangeByWalletId = getCurrentExchangeByWalletId;
exports.getLastTransactionsToAA = getLastTransactionsToAA;
exports.getOperationHistory = getOperationHistory;
exports.getContributorsRanking = getContributorsRanking;
exports.getDonatorsRanking = getDonatorsRanking;
exports.getNicknameForAddress = getNicknameForAddress;
exports.getContributorsGreeting = getContributorsGreeting;