<template>
	<div class="pt-1">
		<span v-if="symbol">
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
				- <a :href="conf.odex_url+'trade/'+pair.baseTokenSymbol+'/'+pair.quoteTokenSymbol" target="blank">{{pair.baseTokenSymbol+'/'+pair.quoteTokenSymbol}}</a>
			</li>
			</ul>
		</span>
	</div>
</template>

<script>
const conf = require("../../conf.js");
import moment from 'moment'

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
			arrPairs: [],
			conf: conf
		}
	},
	computed: {

	},
	created (){
		this.axios.get(conf.odex_url + '/api/info/fees').then((response) => {
				const assocQuotes = response.data.data;
				for (var quote in assocQuotes){
					this.arrPairs.push({
						quoteTokenSymbol: quote,
						baseTokenSymbol:this.symbol
					});
				}
		});
	}
}
</script>

<style lang='scss' scoped>

</style>
