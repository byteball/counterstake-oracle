<template>
	<span>
		<a :href="link" target="_blank">{{$t('createOptionLinkLabel')}}</a>
	</span>
</template>

<script>
const conf = require("../../conf.js");
import moment from 'moment'

export default {
	props: {
		question: {
			type: Object,
			required: true
		}
	},
	data(){
		return {
			gb_to_bytes: conf.gb_to_bytes,
			link: 'test'
		}
	},
	created (){
		this.link = conf.options_website_base_url + "deploy?oracle=" + conf.aa_address+ "&feed_name=" + this.question.question_id
		+"&comparison=%3D%3D&feed_value=yes&expire_date="+moment.unix(this.question.deadline).format('YYYY-MM-DD')
	}
}
</script>

<style lang='scss' scoped>
.default{

}
</style>


