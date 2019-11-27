 
<template>
		<section>
				<button class="button is-primary is-medium"
						@click="createQuestion()">
						{{$t('landingPageButtonCreateQuestion')}}
				</button>
		</section>
</template>



<script>
import QuestionModal from './QuestionModal.vue';
import QuestionCreateModal from './QuestionCreateModal.vue';

const conf = require("../conf.js");

export default {
	props: {
		question_id: {
			type: String,
			required: false
		}

	},
	components: {
		
	},
	created(){
		if(this.question_id)
			this.openQuestionModal(this.question_id);
	},
	methods: {
		openQuestionModal(question_id) {
			this.$buefy.modal.open({
					parent: this,
					component: QuestionModal,
					hasModalCard: true,
					props: {
						question_id: question_id
					},
					customClass: 'custom-class custom-class-2'
			})
		},
		createQuestion() {
			this.$buefy.modal.open({
					parent: this,
					component: QuestionCreateModal,
					hasModalCard: true,
					width:"640",
					customClass: 'custom-class custom-class-2'
			})
		}
	}
}
</script>