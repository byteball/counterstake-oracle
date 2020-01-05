<template>
	<div v-if="pendingActions.length>0" :class="getClass">
		{{displayed_pending_action}}
	</div>
</template>

<script>
const conf = require("../../conf.js");
const duty_cycle = 0.7;
const period_in_seconds = 2;


export default {
	props: {
		pendingActions: {
			type: Array,
			required: true
		}
	},
	data(){
		return {
			gb_to_bytes: conf.gb_to_bytes,
			timerId: null,
			blinking_state: true,
			counter: 0,
			action_index: 0,
			displayed_pending_action: ''
		}
	},
	computed:{
		getClass: function(){
			return this.blinking_state ? 'default' : 'invisible'
		}
	},
	created(){
		this.timerId = setInterval(this.update, 100);
	},
	beforeDestroy(){
		clearInterval(this.timerId);
	},
	methods:{
		update: function(){
			this.counter++;
			if (this.counter < duty_cycle * 10 * period_in_seconds)
				this.blinking_state = true;
			else {
				this.blinking_state = false;
			}
			if (this.counter >= 10 * period_in_seconds){
				this.action_index++;
				if (this.action_index >= this.pendingActions.length){
					this.action_index = 0;
				}
				this.updateDisplayedPendingAction();
				this.counter = 0;
			}
		},
		updateDisplayedPendingAction: function() {
			var text = '';
			const action = this.pendingActions[this.action_index];
			if (!action)
				return;
				if (action.stake){
					text += action.staker + " is staking " + action.stake/conf.gb_to_bytes + " on " + action.reported_outcome + ".";
					text += "\n";
				} else if (action.committed_outcome){
					text += "Result " + action.committed_outcome + " is being committed.";
				} else if (action.paid_out_amount){
					text += action.paid_out_amount/conf.gb_to_bytes + "GB are being paid to " + action.paid_out_address;
				}

			this.displayed_pending_action = text;
		}
	}
}
</script>

<style lang='scss' scoped>
@import "~bulma/sass/utilities/_all";

.default{
	color: $warning;
}

.invisible {
	visibility: hidden;
}
</style>

