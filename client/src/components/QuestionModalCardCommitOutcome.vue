<template>
		<div class="modal-card" style="min-width:400px;">
			<header class="modal-card-head">
				<p class="modal-card-title">{{$t('questionCommitModalTitle')}}</p>
			</header>
			<section class="modal-card-body">
			<h4 class="title is-4">{{question.question}}</h4>
				<hr>
				<div v-if="question.unconfirmedEvents" class="mt-1">
					<unconfirmed-events :unconfirmedEvents="question.unconfirmedEvents" />
				</div>
			<div class="py-2">
				<div class="is-inline">
					Resulting outcome: 
				</div >
					<b-tag 
						:class="{
							'is-success ml-05' : question.outcome == 'yes',
							'is-danger ml-05' :  question.outcome == 'no',
						}"
						size="is-medium">
						{{question.outcome}} 
					</b-tag> 		</div >
		<div v-if="!link">
		<question-history :question="question" />
		</div>
			<div v-else>
				<div class="py-2">
					<p>{{$t("commitOutcomeLinkHeader")}}</p>
						<icon-link :link="link" />
					<p class="mt-1">{{$t('commitOutcomeLinkFooter')}}</p>
				</div>
			</div>
		</section>
		<footer class="modal-card-foot">
			<button class="button" type="button" @click="$emit('close')">{{$t('commonButtonClose')}}</button>
			<button v-if="!link" class="button is-primary" type="button" @click="commit">{{$t('commonButtonCreateLink')}}</button>
		</footer>
	</div>
</template>

<script>
const conf = require("../conf.js");
import QuestionHistory from './commons/QuestionHistory.vue';
import UnconfirmedEvents from './commons/UnconfirmedEvents.vue';
import IconLink from './commons/IconLink.vue'

export default {	
	components: {
		QuestionHistory,
		UnconfirmedEvents,
		IconLink
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
			const data = {
				question_id: this.question.question_id,
				commit: true
			};

			const json_string = JSON.stringify(data);
			const base64data = encodeURIComponent(btoa(json_string));
			this.link = conf.protocol+":"+conf.aa_address+"?amount=10000&base64data="+base64data;
		}
	}
}
</script>

<style lang='scss' scoped>

</style>

