const conf = require('../conf.js')

export default {
	methods: {
		getEventMessage: function(event){
			var message = ''

			if (event.event_type == "new_question") {
				message += event.concerned_address + " creates a new question."
			} else if (event.event_type == "initial_stake") {
				message += event.concerned_address + " reports " + event.reported_outcome
			} else if (event.event_type == "stake") {
				message += event.concerned_address + " counterstakes for " + event.reported_outcome
			} else if (event.event_type == "commit") {
				message += event.event_data.author + " commits result "
			} else if (event.event_type == "withdraw") {
				message += this.getByteAmountString(event.paid_out) + " paid to " + event.concerned_address
			}
			return message;
		},
		getByteAmountString: function(amount){
			return (amount/conf.gb_to_bytes >=1 ? ((amount/conf.gb_to_bytes).toPrecision(6)/1).toLocaleString(): ((amount/conf.gb_to_bytes).toPrecision(6)/1)) + 'GB'
		}
  }
};


/*
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
	} else if (objResponse.your_stake){
		objEvent.event_type = objResponse.expected_reward ? "initial_stake" : "stake";
		objEvent.paid_in = objResponse.your_stake;
		objEvent.concerned_address = trigger.address;
		objEvent.event_data.staked_on_yes = objResponse.total_staked_on_yes || 0;
		objEvent.event_data.staked_on_no = objResponse.total_staked_on_no || 0;
		objEvent.event_data.reported_outcome = objResponse.reported_outcome;
		objEvent.event_data.resulting_outcome = objResponse.new_outcome;

	} else if (objResponse.committed_outcome){
		objEvent.event_type = "commit";
		objEvent.paid_out = objResponse.paid_out_amount;
		objEvent.concerned_address = objResponse.paid_out_address;
	} else if (objResponse.paid_out_amount){
		objEvent.event_type = "withdraw";
		objEvent.paid_out = objResponse.paid_out_amount;
		objEvent.concerned_address = objResponse.paid_out_address;
	}*/