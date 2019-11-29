<template>
	<div class="container">
		<b-navbar>
			<template slot="brand">
					<b-navbar-item tag="router-link" :to="{ path: '/' }">
						<h1 class="title is-1">Counterstake.org</h1>
					</b-navbar-item>
			</template>
		</b-navbar>
		<div>
						<section>
				<questions-table />
			</section>
			<section>
					<button class="button is-primary is-medium" @click="createQuestion()">
						{{$t('landingPageButtonCreateQuestion')}}
					</button>
			</section>
		</div>
	</div>
</template>

<script>
import QuestionModal from './QuestionModal.vue';
import QuestionCreateModal from './QuestionCreateModal.vue';
import QuestionsTable from './QuestionsTable.vue';

const conf = require("../conf.js");

export default {
	props: {
		question_id: {
			type: String,
			required: false
		},
			question: {
			type: Object,
			required: false
		}

	},
	components: {
		QuestionsTable
	},
	created(){
		if(this.question_id)
			this.openQuestionModal(this.question_id);
	},
	watch:{

		question_id: function(){
			if(this.question_id)
				this.openQuestionModal(this.question_id);

		}
	},
	methods: {
		openQuestionModal(question_id) {
			this.$buefy.modal.open({
					parent: this,
					component: QuestionModal,
					hasModalCard: true,
					props: {
						propQuestionId: question_id,
						propQuestion: this.question
					},
					onCancel:()=>{
						console.log("on cancel");
						this.$router.push({ name: 'landingPage'});
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
		},
		questionModalClosed(){


		}
	}
}
</script>