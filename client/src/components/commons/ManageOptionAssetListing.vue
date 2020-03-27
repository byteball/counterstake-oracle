<template>
	<div class="pt-1">
		<span v-if="is_asset_listed">This asset is listed on <a :link="conf.odex_url">Odex</a></span>
		<span v-else>This asset is not listed on Odex.</span>
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
		}
	},
	data(){
		return {
			is_asset_listed: false,
			conf: conf
		}
	},
	computed: {

	},
	created (){
		this.axios.get(conf.odex_url + '/api/pairs').then((response) => {
			response.data.data.forEach((objPair)=>{
				if (objPair.baseAsset == this.asset || objPair.quoteAsset == this.asset)
					this.is_asset_listed = true;
			});
		});
	}
}
</script>

<style lang='scss' scoped>

</style>
