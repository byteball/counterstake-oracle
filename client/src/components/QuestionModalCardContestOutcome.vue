<template>
	<div class="modal-card" style="min-width:400px;">
		<header class="modal-card-head">
			<p class="modal-card-title">{{$t('contestOutcomeModalTitle')}}</p>
		</header>
		<section class="modal-card-body">
			<h4 class="title is-4">{{question.question}}</h4>
			<hr>
			<div v-if="!link" >
				<div v-if="question.unconfirmedEvents"  class="py-2">
					<unconfirmed-events :unconfirmedEvents="question.unconfirmedEvents" />
				</div>
				<div class="pt-1"><b>{{question.description}}</b></div>
				<div class="pt-1">
					<div class="is-inline">
						{{$t('contestOutcomeCurrentOutcome')}}
					</div>
					<b-tag 
						:class="{
							'is-success ml-05' : question.outcome == 'yes',
							'is-danger ml-05' :  question.outcome == 'no',
						}"
						size="is-medium">
						{{question.outcome}} 
					</b-tag>
					<div class="mt-05">{{$t('contestOutcomePeriodEnd')}}<b>{{challengeCountdown}}</b></div>
				</div>
				<div class="py-3">
					<div>
						<label for="range-1">{{$t("contestOutcomeAmountToStake")}} on <b>{{my_outcome}}</b></label>
						<b-slider v-if="sliderEnabled" id="range-1" 
						v-model="stakeAmountGb" 
						:min="conf.challenge_min_stake_gb" 
						:max="reversalStakeGb" 
						:step="0.00000001"
						class="px-1"
						/>
					</div>

					<div class="pt-3">
						<i18n path="contestOutcomeGainIfReversed" id="potential-gain">
							<template #stake_amount>
								<byte-amount :amount="stakeAmount" />
							</template>
							<template #gain_amount>
								<byte-amount :amount="potentialGainAmount" /> 
							</template>
						</i18n>
					</div>

					<div v-if="amountLeftToReverse>0">
						<p>
						<i18n path="contestOutcomeAmountLeft" id="amount-left">
							<template #amount>
								<byte-amount :amount="amountLeftToReverse" />
							</template>
							<template #gain_amount>
								<byte-amount :amount="potentialGainAmount" /> 
							</template>
						</i18n>
							</p>
					</div >
				</div>
				<question-history :question="question" />
			</div>
			<div v-else fluid >
				<div class="py-3">
					<p>{{$t("contestOutcomeLinkHeader", {outcome: my_outcome})}}</p>
						<wallet-link :link="link" />
					<p class="mt-1">{{$t('contestOutcomeLinkFooter')}}</p>
				</div>
			</div>
		</section>
		<footer class="modal-card-foot">
			<button class="button" type="button" @click="$emit('close')">{{$t('commonButtonClose')}}</button>
			<button v-if="!link" class="button is-primary" type="button" @click="contest">{{$t('commonButtonCreateLink')}}</button>
		</footer>
	</div>
</template>

<script>
const conf = require("../conf.js");
import ByteAmount from './commons/ByteAmount.vue';
import QuestionHistory from './commons/QuestionHistory.vue';
import moment from 'moment/src/moment'
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
		},
	},
	data(){
		return {
			conf: conf,
			reversalStakeGb: 0,
			reversalStake: 0,
			stakeAmountGb: 0,
			stakeAmount: 0,
			isOkDisabled: false,
			link: false,
			urls: [],
			sliderEnabled: false,
			my_outcome: null
		}
	},
	computed:{
		getTitle:function(){
			return "";
		},
		amountLeftToReverse: function(){
			return this.reversalStake - this.stakeAmount;
		},
		potentialGainAmount: function(){
			return this.stakeAmount / conf.challenge_coeff;
		}
	},
	watch:{
		stakeAmountGb: function(){
			if (this.stakeAmountGb > this.reversalStakeGb)
				this.stakeAmountGb = this.reversalStakeGb;
			if (this.stakeAmountGb < conf.challenge_min_stake_gb)
				this.stakeAmountGb = conf.challenge_min_stake_gb;
			this.stakeAmount = this.stakeAmountGb * conf.gb_to_bytes;
		}
	},
	created(){
		this.reversalStake = (conf.challenge_coeff*this.question.staked_on_outcome - this.question.staked_on_opposite);
		this.reversalStakeGb = this.reversalStake/conf.gb_to_bytes;
		this.stakeAmountGb = this.reversalStakeGb;
		this.sliderEnabled = true;
		this.my_outcome = this.question.outcome == 'yes' ? 'no' : 'yes';
		this.challengeCountdown = moment().to(moment.unix(conf.challenge_period_in_days*24*3600  + this.question.countdown_start));
		this.reset();

	},
	methods:{
		urls_updated(urls, bAreUrlsValid){
			this.urls = urls;
			this.isOkDisabled = !bAreUrlsValid;
		},
		reset(){
		},
		contest(bvModalEvt){
				bvModalEvt.preventDefault()	;
				const data = {
						question_id: this.question.question_id,
						outcome: this.my_outcome
				};
				const json_string = JSON.stringify(data);
				const base64data = encodeURIComponent(btoa(json_string));
				this.link = conf.protocol+":"+conf.aa_address+"?amount="
					+Math.round(this.stakeAmountGb*conf.gb_to_bytes)+"&base64data="+base64data;
		}
	}
}
</script>

<style lang='scss' scoped>
</style>