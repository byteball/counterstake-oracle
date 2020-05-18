<template>
	<div class="modal-card" style="min-width:400px;">
		<header class="modal-card-head">
			<p class="modal-card-title">{{$t('reportOutcomeModalTitle')}}</p>
		</header>
		<section class="modal-card-body">
			<h4 class="title is-4" > {{question.question}} </h4>
			<hr class="new">
			<div v-if="!link" ref="div-report">
				<div v-if="question.unconfirmedEvents" class="py-1">
					<unconfirmed-events :unconfirmedEvents="question.unconfirmedEvents" />
				</div>
				<div class="pt-1"><b>{{question.description}}</b></div>
				<div class="py-1">
					<div class="py-1" >
						{{$t('reportOutcomeReportOutcome')}}
					</div>
					<div class="level pb-2">
						<div class="level-item" />
						<b-button type="is-primary is-medium level-item" :outlined="selectedOutcome!='yes'" @click="selectedOutcome='yes'" ref="button-yes">Yes</b-button>
						<div class="level-item" />
						<b-button type="is-primary is-medium level-item"  :outlined="selectedOutcome!='no'"  @click="selectedOutcome='no'" ref="button-no">No</b-button>
						<div class="level-item" />
					</div>
					<div class="pb-1">
						{{$t('reportOutcomeAmountToStake')}}<b><byte-amount :amount="amountToStake"/></b>
					</div>
					<div class="pb-1">
						{{$t('reportOutcomeMinReward')}}<b><byte-amount :amount="question.reward"/></b>
					</div>
					<div class="pt-2">
						<question-history :question="question"/>
					</div>
				</div>
			</div>
			<div v-else ref="div-link">
				<div class="py-3">
				<p>{{$t('reportOutcomeLinkHeader')}}</p>
					<wallet-link :link="link" />
				<p class="mt-2">{{$t('reportOutcomeLinkFooter')}}</p>
				</div>
			</div>
		</section>
		<footer class="modal-card-foot">
			<button class="button" type="button" @click="$emit('close')">{{$t('commonButtonClose')}}</button>
			<button v-if="selectedOutcome&&!link" class="button is-primary" type="button"  @click="handleOk" ref="button-create">{{$t('commonButtonCreateLink')}}</button>
		</footer>
	</div>
</template>

<script>
const conf = require("../conf.js")
import ByteAmount from './commons/ByteAmount.vue'
import QuestionHistory from './commons/QuestionHistory.vue';
import UnconfirmedEvents from './commons/UnconfirmedEvents.vue';
import WalletLink from './commons/WalletLink.vue'

export default {
	components: {
		ByteAmount,
		QuestionHistory,
		UnconfirmedEvents,
		WalletLink
	},
	props: {
		question: {
			type: Object,
			required: true
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
			const data = {
					question_id: this.question.question_id,
					outcome: this.selectedOutcome
			};

			const json_string = JSON.stringify(data);
			const base64data = encodeURIComponent(btoa(json_string));
			this.link = conf.protocol+":"+conf.aa_address+"?amount="
				+(this.amountToStake)+"&base64data="+base64data;
		}
	},
	created(){

	}
}
</script>

<style lang='scss' scoped>

</style>


