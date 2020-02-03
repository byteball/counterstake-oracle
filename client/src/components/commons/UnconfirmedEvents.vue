<template>
	<div v-if="unconfirmedEvents.length>0" :class="getClass">
		{{displayed_pending_event}}
	</div>
</template>

<script>
const conf = require("../../conf.js");
const period_in_seconds = 2;
import getEventMessage from '../../mixins/eventMessage'

export default {
	mixins:[getEventMessage],

	props: {
		unconfirmedEvents: {
			type: Array,
			required: true
		}
	},
	data(){
		return {
			timerId: null,
			counter: 0,
			event_index: 0,
			displayed_pending_event: ''
		}
	},
	computed:{
		getClass: function(){
			return 'default' 
		}
	},
	created(){
		this.timerId = setInterval(this.update, 100);
		this.rollDisplayedPendingEvent();
	},
	beforeDestroy(){
		clearInterval(this.timerId);
	},
	methods:{
		update: function(){
			this.counter++;

			if (this.counter >= 10 * period_in_seconds){
				this.event_index++;
				if (this.event_index >= this.unconfirmedEvents.length){
					this.event_index = 0;
				}
				this.rollDisplayedPendingEvent();
				this.counter = 0;
			}
		},
		rollDisplayedPendingEvent: function() {
			var text = '';
			const event = this.unconfirmedEvents[this.event_index];
			if (!event)
				return;
			this.displayed_pending_event = this.getEventMessage(event)
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

