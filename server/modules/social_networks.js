const Discord = require('discord.js');
const conf = require('ocore/conf.js');
const discordChannels = process.env.testnet ? ["675209902230339614"] : [];

var discordClient = null;

enableDiscord();

async function enableDiscord(){
	if (!conf.discord_token)
		return console.log("discord_token missing in conf");
	discordClient = new Discord.Client();
	discordClient.on('ready', () => {
		console.log(`Logged in Discord as ${discordClient.user.tag}!`);
	});
	discordClient.on('error', (error) => {
		console.log(`Discord error: ${error}`);
	});
	await discordClient.login(conf.discord_token);
}
	

function sendToDiscord(text){
	if (!discordClient)
		return console.log("discord client not initialized");
	discordChannels.forEach(function(channel){
		try {
			discordClient.channels.get(channel).send(text);
		} catch(e) {
			console.log("couldn't get channel " + channel + ", reason: " + e);
		}
	});
}


function notify(event, question){

		var message = '';

		if (event.event_type == "new_question") {
			message += event.concerned_address_nickname + " creates a new question: '" + question.question +"'";
		} else if (event.event_type == "initial_stake") {
			message += "Question: '" + question.question + "', " + event.concerned_address_nickname + " reports " + event.event_data.reported_outcome;
		} else if (event.event_type == "stake") {
			message += "Question: '" + question.question + "', " + event.concerned_address_nickname + " counterstakes for " + event.event_data.reported_outcome;
		} else if (event.event_type == "commit") {
			message += "Question: '" + question.question + "', " + event.event_data.author + " commits result " + question.outcome ;
		} else if (event.event_type == "withdraw") {
			message += "Question: '" + question.question + "', " + getByteAmountString(event.paid_out) + " paid to " + event.concerned_address_nickname;
		}

	sendToDiscord(message);
}

function getByteAmountString (amount){
	return (amount/conf.gb_to_bytes >=1 ? ((amount/conf.gb_to_bytes).toPrecision(6)/1).toLocaleString(): ((amount/conf.gb_to_bytes).toPrecision(6)/1)) + 'GB'
}


exports.sendToDiscord = sendToDiscord;
exports.notify = notify;