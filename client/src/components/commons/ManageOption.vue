<template>
	<span>
		<b-collapse :open.sync="isOptionManagingOpen" class="card" aria-id="opionsManagingCollapse">
			<div
					slot="trigger" 
					class="card-header"
					role="button"
					aria-controls="opionsManagingCollapse">
					<p class="card-header-title">
						{{$t('manageOptionCollapseTitle')}}
					</p>
					<a class="card-header-icon">
						<v-icon :name="isOptionManagingOpen ? 'chevron-up' : 'chevron-down'" />
					</a>
			</div>
			<div class="card-content">
				<div class="container">
					<div v-if="!question.is_option_aa_defined" class="row">
						{{$t('createOptionLinkLabel')}} <wallet-link  :href="create_option_link" :isSmall="true" />
					</div>
					<div v-else>
						{{$t('manageOptionAssetIssuer')}}<a :href="see_option_aa_link" target="_blank">{{question.option_address}}</a> 
						<div class="mt-1">
							<assets :question="question"/>
						</div>
					</div>
				</div>
			</div>
		</b-collapse>
	</span>
</template>

<script>
const conf = require("../../conf.js")
import moment from 'moment'
import Assets from './ManageOptionAssets.vue'
import WalletLink from './WalletLink.vue'

export default {
	components:{
		Assets,
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
			create_option_link: '',
			isOptionManagingOpen: false
		}
	},
	created (){
		this.create_option_link = conf.options_website_base_url + "deploy?oracle=" + conf.aa_address+ "&feed_name=" + this.question.question_id
		+"&comparison=%3D%3D&feed_value=yes&expire_date="+moment.unix(this.question.deadline).format('YYYY-MM-DD')
		this.see_option_aa_link = conf.options_website_base_url + "#" + this.question.option_address
	}
}
</script>

<style lang='scss' scoped>

</style>


