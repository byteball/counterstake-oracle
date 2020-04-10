<template>
	<span>
		<div class="tabs-container">
			<b-tabs v-model="activeTab">
				<b-tab-item label="Yes asset">
					<div v-if="question.yes_asset" class="row">
						{{$t("manageOptionNameAssetAsset")}} <a :link="conf.explorer_link + '#' + question.yes_asset">{{question.yes_asset}}</a>
						<div v-if="!question.yes_asset_symbol">
							{{$t("manageOptionNameAssetRegister")}}
							<name-asset :question="question" asset_type="yes" />
						</div>
						<div v-else>
							{{$t("manageOptionNameAssetRegisteredSymbol")}}<b>{{question.yes_asset_symbol}}</b>
						</div>
						<asset-listing :asset="question.yes_asset"/>
					</div>
					<div v-else class="row">
						<i18n path="manageOptionNameAssetIssueAsset">
							<template #asset>
								<b>yes</b>
							</template>
							<template #link>
								<wallet-link  :href="issue_asset_link" :isSmall="true" />
							</template>
						</i18n>
					</div>
				</b-tab-item>
				<b-tab-item label="No asset">
					<div v-if="question.no_asset" class="row">
						{{$t("manageOptionNameAssetAsset")}} <a :link="conf.explorer_link + '#' + question.no_asset">{{question.no_asset}}</a>
						<div v-if="!question.no_asset_symbol">
							{{$t("manageOptionNameAssetRegister")}}
							<name-asset :question="question" asset_type="no" />
						</div>
						<div v-else>
							{{$t("manageOptionNameAssetRegisteredSymbol")}} <b>{{question.no_asset_symbol}}</b>
						</div>
						<asset-listing :asset="question.no_asset"/>
					</div>
					<div v-else class="row">
						<i18n path="manageOptionNameAssetIssueAsset">
							<template #asset>
								<b>no</b>
							</template>
							<template #link>
								<wallet-link  :href="issue_asset_link" :isSmall="true" />
							</template>
						</i18n>
					</div>
				</b-tab-item>
			</b-tabs>
		</div>
	</span>
</template>

<script>
const conf = require("../../conf.js");
import moment from 'moment'
import NameAsset from './ManageOptionNameAsset.vue';
import AssetListing from './ManageOptionAssetListing.vue';
const base64url = require('base64url');
import WalletLink from './WalletLink.vue'

export default {
	components:{
		NameAsset,
		WalletLink,
		AssetListing
	},
	props: {
		question: {
			type: Object,
			required: true
		}
	},
	data(){
		return {
			activeTab: 0,
			conf: conf
		}
	},
	computed: {
		issue_asset_link() {
			const data = this.activeTab ? {define_yes: 1} : {define_no: 1}
			const json_string = JSON.stringify(data);
			const base64data = base64url(json_string);
			return conf.protocol+":"+this.question.option_address+"?amount=10000&base64data="+base64data;
		}
	},
	created (){

	}
}
</script>

<style lang='scss' scoped>
.tabs-container {
	@import "../../assets/custom.scss";
	min-height: 18rem;
	border: solid;
	border-color: $primary;
	border-width: 0.15rem;
	padding: 0.5rem;
}
</style>
