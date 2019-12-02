<template>
	<form action="">
			<div class="modal-card" style="min-width:400px;">
					<header class="modal-card-head">
							<p class="modal-card-title">{{title}}</p>
					</header>
					<section class="modal-card-body">
						<h4 v-if="question" class="title is-4">{{question.question}}</h4>
						<div>
							Deadline: {{question.countdown}}
						</div>
						<div v-if="question&&question.isOngoing">
							<div>{{$t('questionModalHowToOfferContract')}}</div>
							<div>Oracle address: {{conf.aa_address}}</div>
							<div>Feed name: {{question.question_id}}</div>
							<div>Expected value: yes or no</div>
						</div>
						<div v-if="question&&question.isReportable" >
							<report-outcome label="Report:" @link_created="hideHistory=true;" :question="question" />
						</div>
						<div v-if="question&&question.isContestable">
							<contest-outcome label="Contest:" @link_created="hideHistory=true;" :question="question" />
						</div>
						<div v-if="question&&question.isCommittable">
							<commit-outcome label="" @link_created="hideHistory=true;" :question="question" />
						</div>
						<div class="mt-5" v-if="question&&!hideHistory" >
							<b-collapse :open.sync="isHistoryOpen" class="card" aria-id="contentIdForA11y3">
									<div
											slot="trigger" 
											class="card-header"
											role="button"
											aria-controls="contentIdForA11y3">
											<p class="card-header-title">
												History
											</p>
											<a class="card-header-icon">
												<b-icon :icon="isHistoryOpen ? 'angle-up' : 'angle-down'" />
											</a>
									</div>
									<div class="card-content">
										<div class="content">
											<question-history :question="question" />
										</div>
									</div>
							</b-collapse>
						</div>
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
import CommitOutcome from './commons/CommitOutcome'

const conf = require("../conf.js");


	export default  {
		components:{
			ReportOutcome,
			QuestionHistory,
			ContestOutcome,
			CommitOutcome
		},
		props: ['propQuestion','propQuestionId'],

		data() {
			return {
					question: null,
					history: [],
					hideHistory: false,
					conf: conf,
					title: "Question",
					isHistoryOpen: false
				}
			},

		created(){
			if (this.propQuestion){
				this.question = this.propQuestion;
				this.setFlags();
			} else if (this.propQuestionId){
				this.axios.get('/api/question/'+encodeURIComponent(this.propQuestionId)).then((response) => {
					this.question = response.data;
					this.question.countdown = moment().to(moment.unix(this.question.deadline));
					this.setFlags();
					this.setTitle();
				});
			}

		},
		methods:{

			setFlags: function(){
				this.question.isOngoing = moment().isBefore(moment.unix(this.question.deadline));
				this.question.isReportable = !this.question.isOngoing && !this.question.outcome;
				this.question.isContestable = this.question.outcome && moment().isBefore(moment.unix(Number(this.question.countdown_start) + conf.challenge_period_in_days*24*3600 ));
				this.question.isCommittable =  this.question.outcome && !this.question.isContestable;
			},
			setTitle: function(){
				if (this.question.isReportable){
					return this.title = "Report outcome"
				}
				if (this.question.isContestable){
					return this.title = "Contest outcome"
				}
				if (this.question.isCommittable){
					return this.title = "Commit outcome"
				}
			}

		}

	}
</script>
