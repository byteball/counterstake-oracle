<template>
		<div class="modal-card" style="min-width:400px;">
			<header class="modal-card-head">
				<p class="modal-card-title">Resulting outcome</p>
			</header>
			<section class="modal-card-body">
			<h4 class="title is-4">{{question.question}}</h4>
			<hr>
			<div class="py-2">
				<div class="is-inline">
					Resulting outcome: 
				</div >
				<h5 class="title is-5 is-inline"> {{ question.outcome }} </h5>
			</div >
			<div>
			<question-history :question="question" />
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

