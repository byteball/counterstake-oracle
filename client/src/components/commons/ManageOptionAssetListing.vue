<template>
	<div class="pt-1">
		<span v-if="is_asset_listed">
			<i18n path="manageOptionAssetListingAssetListed">
				<template #symbol>
					{{symbol || asset.slice(0,5)}}
				</template>
				<template #link>
					<a :href="conf.odex_url" target="blank">ODEX</a>
				</template>
			</i18n>
			<ul>
			<li v-for="(pair, index) in arrPairs" :key="'pair_'+ index">
				- <a :href="conf.odex_url+'/trade/'+pair.baseTokenSymbol+'/'+pair.quoteTokenSymbol" target="blank">{{pair.baseTokenSymbol+'/'+pair.quoteTokenSymbol}}</a>
			</li>
			</ul>
		</span>
		<span v-else>
			<i18n path="manageOptionAssetListingAssetNotListed">
				<template #link>
					<a :href="conf.odex_url" target="blank">ODEX</a>
				</template>
			</i18n>
		</span>
	</div>
</template>

<script>
const conf = require("../../conf.js");
import moment from 'moment'
const base64url = require('base64url');

export default {
	components:{
	},
	props: {
		asset: {
			type: String,
			required: true
		},
		symbol: {
			type: String,
			required: false
		}
	},
	data(){
		return {
			is_asset_listed: false,
			arrPairs: [],
			conf: conf
		}
	},
	computed: {

	},
	created (){
		this.axios.get(conf.odex_url + '/api/pairs').then((response) => {
			response.data.data.forEach((objPair)=>{
				if (objPair.baseAsset == this.asset || objPair.quoteAsset == this.asset){
				
					this.arrPairs.push(objPair);
					this.is_asset_listed = true;

				}
			});
		});
	}
}
</script>

<style lang='scss' scoped>

</style>
