<template>
	<div>
		<div v-if="!link" fluid >
		<div>
			Current outcome: <h3 class="title is-3"> {{ question.outcome }} </h3>
		</div>


			<div class="pt-3" >
				<label for="range-1">{{$t("contestModalAmountToStake")}}</label>
				<b-slider id="range-1" 
				v-model="stakeAmountGb" 
				type="range" 
				:number="true" 
				:min="conf.challenge_min_stake_gb" 
				:max="reversalStakeGb*1.01" 
				:step="reversalStakeGb/100"/>
			</div >


			<div>
				<span v-if="text_error" class="pt-3">{{text_error}}</span>
				<div class="pt-3">
					<i18n path="contestModalGainIfReversed" id="potential-gain">
						<template #stake_amount>
							<byte-amount :amount="stakeAmount" />
						</template>
						<template #gain_amount>
							<byte-amount :amount="potentialGainAmount" /> 
						</template>
					</i18n>
				</div>
			</div >
			<div v-if="amountLeftToReverse>0">
			<div class="pt-3">
				<i18n path="contestModalAmountLeft" id="amount-left">
					<template #amount>
						<byte-amount :amount="amountLeftToReverse" />
					</template>
					<template #gain_amount>
						<byte-amount :amount="potentialGainAmount" /> 
					</template>
				</i18n>
			</div>
			</div >
		</div>
		<div v-else fluid >
			<div class="pt-3">
				{{$t("contestModalLinkHeader")}}
			</div >
		<div class="pt-3">
			<span class="text-break">
				<a :href="link">{{link}}</a>
			</span>
			</div >
			<div class="py-3">
				{{$t("contestModalLinkFooter")}}
			</div >
		</div>
	</div>
</template>

<script>
const conf = require("../../conf.js");
import ByteAmount from './ByteAmount.vue';

export default {	
	components: {
		ByteAmount
	},
	props: {
		question: {
			type: Object,
			required: true
		},
	},
	data(){
		return {
			text_error: null,
			conf: conf,
			reversalStakeGb:0,
			reversalStake: 0,
			stakeAmountGb: 0,
			stakeAmount: 0,
			isOkDisabled: false,
			link: false,
			urls: [],
			operation_item:{}
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
			return this.reversalStake + (this.operation_item.total_staked - this.operation_item.staked_on_outcome);
		},
		newTotalStake: function(){
			return this.operation_item.total_staked + this.stakeAmount;
		},
		potentialGainAmount: function(){
			return this.stakeAmount / this.newTotalOppositeStakeForReversal *  this.newTotalStake - this.stakeAmount;
		}
	},
	watch:{
		operationItem:function(){
			if(!this.operationItem)
				return;
			this.operation_item = this.operationItem;
			this.reversalStake = (conf.challenge_coeff*this.operation_item.staked_on_outcome - this.operation_item.staked_on_opposite);
			this.reversalStakeGb = this.reversalStake/conf.gb_to_bytes;
			this.stakeAmountGb = this.reversalStakeGb;
			this.reset();
		},
		stakeAmountGb: function(){
			if (this.stakeAmountGb > this.reversalStakeGb)
				this.stakeAmountGb = this.reversalStakeGb;
			if (this.stakeAmountGb < conf.challenge_min_stake_gb)
				this.stakeAmountGb = conf.challenge_min_stake_gb;
			this.stakeAmount = this.stakeAmountGb * conf.gb_to_bytes;
		}
	},
	methods:{
		urls_updated(urls, bAreUrlsValid){
			this.urls = urls;
			this.isOkDisabled = !bAreUrlsValid;
		},
		reset(){
			this.text_error = null;
		},
		handleOk(bvModalEvt){
				bvModalEvt.preventDefault()	;
				const base64url = require('base64url');
				const data = {
						exchange: this.operationItem.exchange
				};

				if (this.operationItem.isRemovingOperation)
					data.add_wallet_id = this.operationItem.wallet_id;
				else
					data.remove_wallet_id = this.operationItem.wallet_id;
				const json_string = JSON.stringify(data);
				const base64data = base64url(json_string);
				this.link = (conf.testnet ? "byteball-tn" :"byteball")+":"+conf.aa_address+"?amount="
					+Math.round(this.stakeAmountGb*conf.gb_to_bytes)+"&base64data="+base64data;
		}
	}
}
</script>

<style lang='scss' scoped>
</style>