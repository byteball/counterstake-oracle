<template>
	<div v-if="pendingActions.length>0" style="width:30px;">
		<b-tooltip
				:label="listPendingActions()"
				multilined>
		<b-progress type="is-warning"></b-progress>
	</b-tooltip>
	</div>
</template>

<script>
const conf = require("../../conf.js");

export default {
	props: {
		pendingActions: {
			type: Array,
			required: true
		}
	},
	data(){
		return {
			gb_to_bytes: conf.gb_to_bytes
		}
	},
	computed:{

	},
	methods:{
		listPendingActions: function() {
			var text = 'Unconfirmed action:\r';
			const action = this.pendingActions[0];
				if (action.stake){
					text += action.staker + " is staking " + action.stake/conf.gb_to_bytes + " on " + action.reported_outcome + ".";
					text += "\n";
				} else if (action.committed_outcome){
					text += "Result " + action.committed_outcome + " is being committed.";
				} else if (action.paid_out_amount){
					text += action.paid_out_amount/conf.gb_to_bytes + " are being paid to " + action.paid_out_address;
				}

			return text;
		}
	}
}
</script>

<style lang='scss' scoped>
.default{

}
</style>

