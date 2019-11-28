const db = require('ocore/db.js');

exports.create = function(){
	return new Promise(async function(resolve){
		console.log("will create tables if not exist");
	

		await db.query("CREATE TABLE IF NOT EXISTS questions_history (\n\
			question_id VARCHAR(60), \n\
			concerned_address CHAR(32) NOT NULL, \n\
			event_type VARCHAR(30) NOT NULL, \n\
			paid_in INTEGER DEFAULT 0,\n\
			paid_out INTEGER DEFAULT 0,\n\
			mci INT NOT NULL, \n\
			aa_address CHAR(32) NOT NULL, \n\
			response TEXT NULL, \n\
			trigger_unit CHAR(44) NOT NULL, \n\
			timestamp INTEGER NOT NULL, \n\
			UNIQUE (trigger_unit, aa_address) \n\
			)");

		await db.query("CREATE INDEX IF NOT EXISTS operationsHistoryByMci ON questions_history(mci)");
		await db.query("CREATE INDEX IF NOT EXISTS operationsHistoryByPair ON questions_history(pair)");
		await db.query("CREATE INDEX IF NOT EXISTS operationsHistoryByQuestionId ON questions_history(question_id)");
		await db.query("CREATE INDEX IF NOT EXISTS operationsHistoryByConcernedAddress ON questions_history(concerned_address)");

	console.log("all tables created");
	resolve();
	});

}