<template>
		<div class="modal-card" style="min-width:400px;">
		<header class="modal-card-head">
			<p class="modal-card-title">Contest outcome</p>
		</header>
		<section class="modal-card-body">
		<div v-if="!link">
			{{label}}
		<button class="button is-primary is-medium" type="button" @click="commit()">commit</button>
		<question-history :question="question" />
		</div>
			<div v-else>
				<p>{{$t("commitOutcomeLinkHeader", {outcome: my_outcome})}}</p>
				<a :href="link">{{link}}</a>
				<p>{{$t('commitOutcomeLinkFooter')}}</p>
			</div>
		</section>
		<footer class="modal-card-foot">
			<button class="button" type="button" @click="$emit('close')">Close</button>
		</footer>
	</div>
</template>

<script>
const conf = require("../conf.js");
import QuestionHistory from './commons/QuestionHistory.vue';

export default {	
	components: {
		QuestionHistory
	},
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

