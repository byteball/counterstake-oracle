<template>
	<div>
		<div class="columns pt-1">
			<div class="column">
				<b-field label="Symbol name">
					<b-input 
					v-model="symbol" 
					:maxlength="40"
					:minlength="1"
					@input='onSymbolChanged' 

					/>
				</b-field>
			</div>
			<div class="column">
					<label for="range-1"><b>{{$t('manageOptionNameAssetDepositAmount', {amount: amount})}}</b></label>
					<b-slider id="range-1" 
					v-model="amount" 
					:min="conf.token_registry_min_deposit_gb" 
					:max="conf.token_registry_min_deposit_gb*100" 
					:step="0.01"
					class="px-1"
					/>
			</div >
		</div>
		<div v-if="symbol.length>0">
			{{$t('manageOptionNameAssetRegisterAsset')}}Register asset: <icon-link  :link="name_asset_link" :isSmall="true" />
		</div>
	</div>
</template>

<script>
const conf = require("../../conf.js");
import moment from 'moment'
import IconLink from './IconLink.vue'

export default {
	components: {
		IconLink
	},
	props: {
		question: {
			type: Object,
			required: true
		},
		asset_type: {
			type: String,
			required: true
		}
	},
	data(){
		return {
			conf: conf,
			create_option_link: '',
			symbol: '',
			isNamingOpen: false,
			amount: conf.token_registry_min_deposit
		}
	},

	created (){

	},
	computed: {
		name_asset_link() {
				const data = {
				asset: this.asset_type == "yes" ? this.question.yes_asset : this.question.no_asset,
				symbol: this.symbol,
				amount: conf.token_registry_min_deposit
			};

			const json_string = JSON.stringify(data);
			const base64data = encodeURIComponent(btoa(json_string));
			return conf.protocol+":"+conf.token_registry_aa_address+"?amount="+this.amount*conf.gb_to_bytes+"&base64data="+base64data;
		}
	},
	methods:{
		onSymbolChanged: function(value){
			this.symbol = value.toUpperCase();
		}
	}
}
</script>

<style lang='scss' scoped>

</style>


