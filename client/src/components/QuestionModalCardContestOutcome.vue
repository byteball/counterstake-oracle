<template>
	<div class="modal-card" style="min-width:400px;">
		<header class="modal-card-head">
			<p class="modal-card-title">Contest outcome</p>
		</header>
		<section class="modal-card-body">
			<h4 class="title is-4">{{question.question}}</h4>
			<hr>
			<div v-if="!link" >
				<div class="pt-1">
					<div class="is-inline">
						Current outcome: 
					</div >
					<h5 class="title is-5 is-inline"> {{ question.outcome }} </h5>
					<div>Challenging period end: <b>{{challengeCountdown}}</b></div>
				</div>
				<div class="py-3">
					<div >
						<label for="range-1">{{$t("contestOutcomeAmountToStake")}} on <b>{{my_outcome}}</b></label>
						<b-slider v-if="sliderEnabled" id="range-1" 
						v-model="stakeAmountGb" 
						:min="conf.challenge_min_stake_gb" 
						:max="reversalStakeGb*1.01" 
						:step="reversalStakeGb/100"/>
					</div >

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
					<div class="mt-2"><a :href="link">{{link}}</a></div>
					<p class="mt-1">{{$t('contestOutcomeLinkFooter')}}</p>
				</div>
			</div>
		</section>
		<footer class="modal-card-foot">
			<button class="button" type="button" @click="$emit('close')">Close</button>
			<button class="button is-primary" type="button" @click="contest">contest and report as {{my_outcome}}</button>
		</footer>
	</div>
</template>

<script>
const conf = require("../conf.js");
import ByteAmount from './commons/ByteAmount.vue';
import QuestionHistory from './commons/QuestionHistory.vue';
import moment from 'moment/src/moment'

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
			return ((this.reversalStake - this.stakeAmount) );
		},
		newTotalOppositeStakeForReversal: function(){
			return this.reversalStake + (Number(this.question.total_staked) - Number(this.question.staked_on_outcome));
		},
		newTotalStake: function(){
			return Number(this.question.total_staked)  + this.stakeAmount;
		},
		potentialGainAmount: function(){
			return this.stakeAmount / this.newTotalOppositeStakeForReversal *  this.newTotalStake - this.stakeAmount;
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
			this.reversalStake = (conf.challenge_coeff*Number(this.question.staked_on_outcome) - Number(this.question.staked_on_opposite));
			this.reversalStakeGb = this.reversalStake/conf.gb_to_bytes;
			this.stakeAmountGb = this.reversalStakeGb;
			this.sliderEnabled = true;
			this.my_outcome = this.question.outcome == 'yes' ? 'no' : 'yes';
			this.challengeCountdown = moment().to(moment.unix(conf.challenge_period_in_days*24*3600  + Number(this.question.countdown_start)));
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
				const base64url = require('base64url');
				const data = {
						question_id: this.question.question_id,
						outcome: this.my_outcome
				};


				const json_string = JSON.stringify(data);
				const base64data = base64url(json_string);
				this.link = (conf.testnet ? "byteball-tn" :"byteball")+":"+conf.aa_address+"?amount="
					+Math.round(this.stakeAmountGb*conf.gb_to_bytes)+"&base64data="+base64data;

				this.$emit('link_created');

		}
	}
}
</script>

<style lang='scss' scoped>
</style>