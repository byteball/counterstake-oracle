 
<template>
    <section>
        <button class="button is-primary is-medium"
            @click="imageModal()">
            Launch image modal (HTML)
        </button>
        <button class="button is-primary is-medium"
            @click="cardModal()">
            Launch card modal (Component)
        </button>
    </section>
</template>



<script>
import QuestionModal from './QuestionModal.vue';
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
		}
	}
}
</script>