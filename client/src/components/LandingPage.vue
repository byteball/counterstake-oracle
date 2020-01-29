<template>
	<div class="container">
		<b-navbar>
			<template slot="brand">
				<b-navbar-item tag="router-link" :to="{ path: '/' }">
					<h1 class="title is-1">{{conf.website_name}}</h1>
				</b-navbar-item>
			</template>
		</b-navbar>
		<section>
			<div class="p-1">
				<h5 class="title is-5">Decentralized oracle on Obyte platform.</h5>
			</div>
		</section>
		<section>
			<b-tabs>
				<b-tab-item label="Questions">
					<questions-table />
				</b-tab-item>
				<b-tab-item label="Last events">
					<last-events-table class="mt-1" />
				</b-tab-item>
				<b-tab-item label="FAQ">
						FAQ
				</b-tab-item>
			</b-tabs>
		</section>

	</div>
</template>

<script>
import QuestionModal from './QuestionModal.vue'
import QuestionsTable from './QuestionsTable.vue'
import LastEventsTable from './LastEventsTable.vue'
import { EventBus } from './../event-bus.js'
const conf = require("../conf.js")

export default {
	components: {
		QuestionsTable,
		LastEventsTable,
	},
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
	data() {
		return {
			conf: conf
		}
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
					this.$router.push({ name: 'landingPage'});
					EventBus.$emit('refresh-questions');
				},
				customClass: 'custom-class custom-class-2'
			})
		},
		closeModalAndRefresh(){


		}
	}
}
</script>