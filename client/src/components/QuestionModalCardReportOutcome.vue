<template>
	<div class="modal-card" style="min-width:400px;">
		<header class="modal-card-head">
			<p class="modal-card-title">Report outcome</p>
		</header>
		<section class="modal-card-body">
			<h4 class="title is-4" > {{question.question}} </h4>
			<hr class="new">
			<div v-if="!link">
				<div class="py-2">
					<div class="py-1" >
						Report outcome:
					</div>
					<div class="level pb-2">
						<div class="level-item" />
						<b-button type="is-primary is-medium level-item" :outlined="selectedOutcome!='yes'" @click="selectedOutcome='yes'">Yes</b-button>
						<div class="level-item" />
						<b-button type="is-primary is-medium level-item"  :outlined="selectedOutcome!='no'"  @click="selectedOutcome='no'">No</b-button>
						<div class="level-item" />
					</div>
					<div class="pb-1">
						Amount to stake: <b><byte-amount :amount="amountToStake"/></b>
					</div>
					<div class="pb-1">
						Reward if your outcome eventually wins: <b><byte-amount :amount="question.reward"/></b>
					</div>
					<div class="pt-2">
						<question-history :question="question"/>
					</div>
				</div>
			</div>
			<div v-else>
				<div class="py-3">
				<p>{{$t('reportOutcomeLinkHeader')}}</p>
				<div class="mt-2"><a :href="link">{{link}}</a></div>
				<p class="mt-2">{{$t('reportOutcomeLinkFooter')}}</p>
				</div>
			</div>
		</section>
		<footer class="modal-card-foot">
			<button class="button" type="button" @click="$emit('close')">Close</button>
			<button v-if="selectedOutcome&&!link" class="button is-primary" type="button"  @click="handleOk">Create link</button>
		</footer>
	</div>
</template>

<script>
const conf = require("../conf.js")
import ByteAmount from './commons/ByteAmount.vue'
import QuestionHistory from './commons/QuestionHistory.vue';

export default {
	components: {
		ByteAmount,
		QuestionHistory
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
			link: null,
			selectedOutcome: null,
			amountToStake: Math.round(conf.challenge_coeff * this.question.reward)
		}
	},
	methods:{
		handleOk:function(){
			const base64url = require('base64url');
			const data = {
					question_id: this.question.question_id,
					outcome: this.selectedOutcome
			};

			const json_string = JSON.stringify(data);
			const base64data = base64url(json_string);
			this.link = (conf.testnet ? "byteball-tn" :"byteball")+":"+conf.aa_address+"?amount="
				+(this.amountToStake)+"&base64data="+base64data;
		}
	}
}
</script>

<style lang='scss' scoped>
.default{

}
</style>


