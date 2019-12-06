<template>
	<div class="modal-card" style="min-width:400px;">
		<header class="modal-card-head">
			<p class="modal-card-title">Question</p>
		</header>
		<section class="modal-card-body">
			<h4 class="title is-4">{{question.question}}</h4>
				<div>{{$t('questionModalHowToOfferContract')}}</div>
				<div>Oracle address: {{conf.aa_address}}</div>
				<div>Feed name: {{question.question_id}}</div>
				<div>Expected value: yes or no</div>
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

export default  {
	components:{
		QuestionHistory
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
