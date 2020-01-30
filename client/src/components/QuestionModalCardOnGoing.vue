<template>
	<div class="modal-card" style="min-width:400px;">
		<header class="modal-card-head">
			<p class="modal-card-title">Question</p>
		</header>
		<section class="modal-card-body">
			<h4 class="title is-4">{{question.question}}</h4>
			<hr>
			<div class="pt-1"><b>{{question.description}}</b></div>
			<div class="pt-1">Reporting start: <b>{{question.countdown}}</b></div>
			<div class="pt-2">
				<div>{{$t('questionModalHowToOfferContract')}}</div>
				</div>
			<div class="py-1">
				<div>Oracle address: <b>{{conf.aa_address}}</b></div>
				<div>Feed name: <b>{{question.question_id}}</b></div>
				<div>Expected value: <b>yes</b> or <b>no</b></div>
				<create-option :question="question" />
			</div>
			<div class="py-2">
				<question-history :question="question"/>
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
import CreateOption from './commons/CreateOption.vue';

export default  {
	components:{
		QuestionHistory,
		CreateOption
	},
	props: {
		question: {
			type: Object,
			required: false,
			default:  function () {
				return {}
			}
		}
	},
	data() {
		return {
		conf: conf

			}
		},

	created(){

	},
	methods:{



	}

}
</script>
