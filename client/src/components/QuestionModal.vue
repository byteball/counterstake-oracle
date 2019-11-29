<template>
	<form action="">
			<div class="modal-card" style="width: auto">
					<header class="modal-card-head">
							<p class="modal-card-title">Question</p>
					</header>
					<section class="modal-card-body">
					<h4 class="title is-4">{{question.question}}</h4>

					<div v-if="question.isReportable">
						<report-outcome label="Report:" @link_created="hideHistory=true;" :question="question" />
					</div>
					<div v-if="question.isContestable">
						<contest-outcome label="Contest:" @link_created="hideHistory=true;" :question="question" />
					</div>
						<question-history v-if="question&&!hideHistory" :question="question" />

					</section>
					<footer class="modal-card-foot">
							<button class="button" type="button" @click="$router.push({ name: 'landingPage'});$parent.close();">Close</button>
					</footer>
			</div>
	</form>
</template>

<script>
import moment from 'moment/src/moment'
import ReportOutcome from './commons/ReportOutcome'
import QuestionHistory from './commons/QuestionHistory'
import ContestOutcome from './commons/ContestOutcome'

const conf = require("../conf.js");


	export default  {
		components:{
			ReportOutcome,
			QuestionHistory,
			ContestOutcome
		},
		props: ['propQuestion','propQuestionId'],

		data() {
			return {
					question: null,
					history: [],
					hideHistory: false
				}
			},

		created(){
			if (this.propQuestion){
				this.question = this.propQuestion;
				this.setFlags();
			} else if (this.propQuestionId){
				this.axios.get('/api/question/'+this.propQuestionId).then((response) => {
					this.question = response.data;
					this.setFlags();
				});
			}

		},
		methods:{

			setFlags: function(){
				this.question.isReportable = moment().isAfter(moment.unix(this.question.deadline)) && !this.question.outcome;
				console.log(this.question);
				this.question.isContestable = this.question.outcome && moment().isBefore(moment.unix(Number(this.question.countdown_start) + conf.challenge_period_in_days*24*3600 ));

			}

		}

	}
</script>
