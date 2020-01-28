const express = require('express')
const rateLimit = require("express-rate-limit");
const expressLogging = require('express-logging');
const logger = require('logops');
const validationUtils = require("ocore/validation_utils.js");
const conf = require('ocore/conf.js');

require('./modules/sqlite_tables.js').create().then(function(){
	
	const aa_handler = require("./modules/aa_handler.js");
//	const social_networks = require('./modules/social_networks.js');
	const app = express()

	const limiter = rateLimit({
		windowMs: 5 * 60 * 1000, // 5 minutes
		max: 500 // limit each IP to 300 requests per windowMs
	});

	app.set('trust proxy', 1);

	app.use(limiter);
	app.use(expressLogging(logger));


	app.get('/api/questions', function(request, response){
		console.log('/api/operations');
		return response.send(aa_handler.getCurrentQuestions());
	});

	app.get('/api/question/:question_id', function(request, response){
		const question_id = request.params.question_id;
		if(!validationUtils.isNonemptyString(question_id))
			return response.status(400).send('Wrong question id');

		return response.send(aa_handler.getQuestion(question_id));
	});

	app.get('/api/question-history/:id', function(request, response){
		const id = request.params.id;
		console.log("id " + id);
		if (!validationUtils.isNonemptyString(id))
			return response.status(400).send('Invalid question id');
			aa_handler.getQuestionHistory(id, function(objHistory){
				return response.send(objHistory);
			});
	});

	app.get('/api/last-events', function(request, response){
		aa_handler.getLastEvents(function(objLastEvents){
			response.send(objLastEvents);
		})
	});

	app.listen(conf.api_port);

});