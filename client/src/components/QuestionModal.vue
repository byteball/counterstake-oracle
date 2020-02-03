<template>
	<form action="">
			<div v-if="question">
				<pending-question v-if="question.isOngoing" :question="question" @close="closeModal" />
				<report-outcome v-if="question.isReportable" :question="question" @close="closeModal" />
				<contest-outcome v-if="question.isContestable" :question="question" @close="closeModal" />
				<commit-outcome v-if="question.isCommittable" :question="question" @close="closeModal" />
				<claim-gain v-if="question.isWithdrawable" :question="question" @close="closeModal" />
				<committed-outcome v-if="question.isCommitted && !question.isWithdrawable" :question="question" @close="closeModal" />
			</div>
	</form>
</template>

<script>
import moment from 'moment/src/moment'
import CommitOutcome from './QuestionModalCardCommitOutcome'
import ClaimGain from './QuestionModalCardClaimGain'
import PendingQuestion from './QuestionModalCardPending'
import ReportOutcome from './QuestionModalCardReportOutcome'
import ContestOutcome from './QuestionModalCardContestOutcome'
import CommittedOutcome from './QuestionModalCardCommittedOutcome'
import { EventBus } from './../event-bus.js';

const conf = require("../conf.js");

export default  {
	components:{
		PendingQuestion,
		ReportOutcome,
		ContestOutcome,
		CommitOutcome,
		ClaimGain,
		CommittedOutcome
	},
	props: ['propQuestion','propQuestionId'],

	data() {
		return {
				question: null,
				history: [],
				hideHistory: false,
				conf: conf,
				isHistoryOpen: false,
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
			});
		}

	},
	methods:{

		setFlags: function(){
			this.question.isOngoing = moment().isBefore(moment.unix(this.question.deadline));
			this.question.isReportable = !this.question.isOngoing && !this.question.outcome;
			this.question.isContestable = this.question.status == "being_graded" && moment().isBefore(moment.unix(this.question.countdown_start + conf.challenge_period_in_days*24*3600 ));
			this.question.isCommittable =  this.question.status == "being_graded"  && !this.question.isContestable;
			if (this.question.status == "committed"){
				this.question.isCommitted = true;
				const assocStakedByAdress =	this.question.staked_by_address;
				const outcome = this.question.outcome
				this.question.claimAddresses = [];
				for (var key in assocStakedByAdress){
					if (assocStakedByAdress[key][outcome]){
						this.question.isWithdrawable = true;
						this.question.claimAddresses.push(key);
					}
				}
			}
			
		},
		closeModal: function(){
			this.$router.push({ name: 'landingPage'});
			EventBus.$emit('refresh-questions');
			this.$parent.close();
		}
	}
}

</script>
