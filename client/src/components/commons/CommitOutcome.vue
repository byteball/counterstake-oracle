<template>
	<div>
		<div v-if="!link">
			{{label}}
		<button class="button is-primary is-medium" type="button" @click="commit()">commit</button>
		</div>
				<div v-else>
					<p>{{$t("commitOutcomeLinkHeader", {outcome: my_outcome})}}</p>
					<a :href="link">{{link}}</a>
					<p>{{$t('commitOutcomeLinkFooter')}}</p>
				</div>
	</div>
</template>

<script>
const conf = require("../../conf.js");

export default {
	props: {
		question: {
			type: Object,
			required: true
		},
		label: {
			type: String,
		}
	},
	data(){
		return {
			link: null
		}
	},
	methods:{
		commit:function(outcome){

			console.log(this.question);
	const base64url = require('base64url');
			const data = {
					question_id: this.question.question_id,
					commit: true
			};

			const json_string = JSON.stringify(data);
			const base64data = base64url(json_string);
			this.link = (conf.testnet ? "byteball-tn" :"byteball")+":"+conf.aa_address+"?amount="
				+(this.question.reward)+"&base64data="+base64data;
			this.$emit('link_created');
		}
	}
}
</script>

<style lang='scss' scoped>
.default{

}
</style>


