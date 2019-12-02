<template>
	<div>
		<div v-if="!link">
			<div class="mt-2" >
	{{label}}
			</div>
			<div class="level mt-1">
				<div class="level-item" />
				<button class="button is-primary is-medium level-item" type="button" @click="report('yes')">Yes</button>
				<div class="level-item" />
				<button class="button is-primary is-medium level-item" type="button" @click="report('no')">No</button>
				<div class="level-item" />
			</div>
			<div>
				Amount to stake: <byte-amount :amount="question.reward"/>
			</div>
		</div>
				<div v-else>
					<p class="mt-2">{{$t('reportOutcomeLinkHeader')}}</p>
					<div class="mt-2"><a :href="link">{{link}}</a></div>
					<p class="mt-1">{{$t('reportOutcomeLinkFooter')}}</p>
				</div>
	</div>
</template>

<script>
const conf = require("../../conf.js")
import ByteAmount from './ByteAmount.vue'

export default {
	components: {
		ByteAmount
	},
	props: {
		question: {
			type: Object,
			required: true
		},
		label: {
			type: String,
		}
	},
	data(){
		return {
			link: null
		}
	},
	methods:{
		report:function(outcome){
			const base64url = require('base64url');
			const data = {
					question_id: this.question.question_id,
					outcome: outcome
			};

			const json_string = JSON.stringify(data);
			const base64data = base64url(json_string);
			this.link = (conf.testnet ? "byteball-tn" :"byteball")+":"+conf.aa_address+"?amount="
				+(this.question.reward)+"&base64data="+base64data;
			this.$emit('link_created');
		}
	}
}
</script>

<style lang='scss' scoped>
.default{

}
</style>


