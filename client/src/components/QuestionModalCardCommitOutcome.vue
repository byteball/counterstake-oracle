<template>
		<div class="modal-card" style="min-width:400px;">
			<header class="modal-card-head">
				<p class="modal-card-title">Commit outcome</p>
			</header>
			<section class="modal-card-body">
			<h4 class="title is-4">{{question.question}}</h4>
				<hr>
				<div class="mt-1">
					<unconfirmed-events :unconfirmedEvents="question.unconfirmedEvents" />
				</div>
			<div class="py-2">
				<div class="is-inline">
					Resulting outcome: 
				</div >
			<h5 class="title is-5 is-inline"> {{ question.outcome }} </h5>
		</div >
		<div v-if="!link">
		<question-history :question="question" />
		</div>
			<div v-else>
				<div class="py-2">
					<p>{{$t("commitOutcomeLinkHeader")}}</p>
					<div class="mt-2"><a :href="link">{{link}}</a></div>
					<p class="mt-1">{{$t('commitOutcomeLinkFooter')}}</p>
				</div>
			</div>
		</section>
		<footer class="modal-card-foot">
			<button class="button" type="button" @click="$emit('close')">Close</button>
			<button v-if="!link" class="button is-primary" type="button" @click="commit">Create link</button>
		</footer>
	</div>
</template>

<script>
const conf = require("../conf.js");
import QuestionHistory from './commons/QuestionHistory.vue';
import UnconfirmedEvents from './commons/UnconfirmedEvents.vue';

export default {	
	components: {
		QuestionHistory,
		UnconfirmedEvents
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
			this.link = (conf.testnet ? "byteball-tn" :"byteball")+":"+conf.aa_address+"?amount=10000&base64data="+base64data;
			this.$emit('link_created');
		}
	}
}
</script>

<style lang='scss' scoped>
.default{

}
</style>

