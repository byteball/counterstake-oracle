const conf = require('../conf.js')

export default {
	methods: {
		getEventMessage: function(event){
			var message = ''

			if (event.event_type == "new_question") {
				message += (event.concerned_address_nickname || event.concerned_address) + " creates a new question."
			} else if (event.event_type == "initial_stake") {
				message += (event.concerned_address_nickname || event.concerned_address) + " reports " + event.event_data.reported_outcome
			} else if (event.event_type == "stake") {
				message += (event.concerned_address_nickname || event.concerned_address) + " counterstakes for " + event.event_data.reported_outcome
			} else if (event.event_type == "commit") {
				message += event.event_data.committer + " commits result "
			} else if (event.event_type == "withdraw") {
				message += this.getByteAmountString(event.paid_out) + " paid to " + (event.concerned_address_nickname || event.concerned_address)
			}
			return message;
		},
		getByteAmountString: function(amount){
			return (amount/conf.gb_to_bytes >=1 ? ((amount/conf.gb_to_bytes).toPrecision(6)/1).toLocaleString(): ((amount/conf.gb_to_bytes).toPrecision(6)/1)) + 'GB'
		}
  }
};