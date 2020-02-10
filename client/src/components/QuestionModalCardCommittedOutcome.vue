<template>
		<div class="modal-card" style="min-width:400px;">
			<header class="modal-card-head">
				<p class="modal-card-title">{{$t('questionCommittedModalTitle')}}</p>
			</header>
			<section class="modal-card-body">
			<h4 class="title is-4">{{question.question}}</h4>
			<hr>
			<div class="py-2">

				<div class="is-inline">
					Definitive outcome: 
				</div >
				<h5 class="title is-5 is-inline"> 
					<b-tag 
						:class="{
							'is-success  ml-05' : question.outcome == 'yes',
							'is-danger  ml-05' :  question.outcome == 'no',
						}"
						size="is-medium">
						{{question.outcome}} 
					</b-tag> 
				</h5>
				<div class="mt-1">{{$t('questionCommittedOracleAddress')}}<b>{{conf.aa_address}}</b></div>
				<div>{{$t('questionCommittedFeedName')}}<b>{{question.question_id}}</b></div>
				<div>{{$t('questionCommittedValue')}}<b>{{question.outcome}}</b></div>
			</div>
			<div>
				<question-history :question="question" />
			</div>
		</section>
		<footer class="modal-card-foot">
			<button class="button" type="button" @click="$emit('close')">{{$t('commonButtonClose')}}</button>
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
			link: null,
			conf: conf
		}
	},
	methods:{

	}
}
</script>

<style lang='scss' scoped>
.default{

}
</style>

