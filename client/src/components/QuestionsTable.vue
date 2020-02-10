<template>
	<section>
		<div class="columns">
			<div class="column">
				<b-field label="Search">
					<b-input 
					v-model="search_input"
					@input="applyFilter"
					></b-input>
				</b-field>
			</div>
			<div class="column is-8">
				<b-field label="Filter">
					<div class="buttons">
						<b-button type="is-primary" :outlined="filter_type!='all'" @click="filter_type='all';applyFilter()" >{{$t('questionsTableFilterTagAll')}}</b-button>
						<b-button type="is-primary" :outlined="filter_type!='hot'" @click="filter_type='hot';applyFilter()" >{{$t('questionsTableFilterTagHot')}}</b-button>
						<b-button type="is-primary" :outlined="filter_type!='pending'" @click="filter_type='pending';applyFilter()">{{$t('questionsTableFilterTagPending')}}</b-button>
						<b-button type="is-primary" :outlined="filter_type!='reportable'" @click="filter_type='reportable';applyFilter()" >{{$t('questionsTableFilterTagInReport')}}</b-button>
						<b-button type="is-primary" :outlined="filter_type!='ended'" @click="filter_type='ended';applyFilter()" >{{$t('questionsTableFilterTagEnded')}}</b-button>
						<b-button class="ml-1" type="is-primary"  @click="createQuestion()">{{$t('landingPageButtonCreateQuestion')}}</b-button>
						<b-button type="is-primary"  @click="setNickname()">{{$t('landingPageButtonSetnickname')}}</b-button>
					</div>
				</b-field>
			</div>
		</div>
		<b-table
				:data="filtered_data"
				@click="onClick"
				ref="table"
				hoverable
				paginated
				:per-page="15"
				class="questions-table"
				:row-class="row => !row.is_pending ? 'active' : 'pending' "
				sort-icon="arrow-up"
				sort-icon-size="is-small"
				:default-sort="sortingParameters"
				>
			<template slot-scope="props">

				<b-table-column field="question" custom-key='question' :label="$t('questionsTableColumnHeaderQuestion')">
					{{props.row.question}}
					<unconfirmed-events v-if="props.row.unconfirmedEvents" :unconfirmedEvents="props.row.unconfirmedEvents" />
				</b-table-column>

				<b-table-column field="deadline" custom-key='deadline' :label="getTimeLabel" sortable>
					{{props.row.countdown}}
				</b-table-column>

				<b-table-column :visible="filter_type!='ended'"  field="reward" custom-key='reward' :label="getRewardLabel" sortable>
					<byte-amount v-if="props.row.reward" :amount="props.row.reward" />
				</b-table-column>

				<b-table-column field="outcome" custom-key='outcome' :label="$t('questionsTableColumnHeaderOutcome')" sortable>
					<b-tag v-if = "props.row.outcome" :class="{
						'is-warning': props.row.beingGraded,
						'is-success' : !props.row.beingGraded && props.row.outcome == 'yes',
						'is-danger' : !props.row.beingGraded && props.row.outcome == 'no',
							}">{{props.row.outcome}}</b-tag>
					<span v-else>{{$t('questionsTableColumnNotKnownYet')}}</span>
				</b-table-column>

				<b-table-column :visible="filter_type!='ended' && filter_type!='pending'" custom-key='possibleAction' field="possibleAction" :label="$t('questionsTableColumnActionAvailable')" sortable>
					{{props.row.possibleAction}}
				</b-table-column>
			</template>
		</b-table>
	</section>
</template>

<script>


const conf = require("../conf.js");
import moment from 'moment/src/moment'
import ByteAmount from './commons/ByteAmount.vue';
import UnconfirmedEvents from './commons/UnconfirmedEvents.vue';
import QuestionCreateModal from './QuestionCreateModal.vue';
import SetNicknameModal from './SetNicknameModal.vue';

import { EventBus } from './../event-bus.js';

export default {

	components: {
		ByteAmount,
		UnconfirmedEvents
	},
	data() {
		return {
			data: [],
			filtered_data: [],
			timerId: null,
			search_input: '',
			filter_type: 'hot',
			sortingParameters: ['deadline', 'asc']
		}
	},
	watch: {

	},
	computed: {
		getTimeLabel: function(){
			if (this.filter_type == 'ended')
				return this.$t('questionsTableColumnReportTime')
			if (this.filter_type == 'pending')
				return this.$t('questionsTableColumnReportTime');
			else
				return this.$t('questionsTableColumnReportTimeChallengeTime')
		},
		getRewardLabel: function(row){
			if (this.filter_type == 'pending')
				return this.$t('questionsTableColumnHeaderReward')
			else
				return this.$t('questionsTableColumnHeaderRewardOrPotentialGain')
		},
	},
	created(){
		this.getData();
		this.timerId = setInterval(this.getData, 60000);
		EventBus.$on("refresh-questions", this.getData);
	},
	beforeDestroy(){
		clearInterval(this.timerId);
	},
	methods: {

		onClick: function(item){
			this.$router.push({ name: 'landingPageQuestion', params: { question_id: item.question_id, question: item } })
		},
		applyFilter(){

			if (this.search_input.length > 0){
				this.filtered_data = this.data.filter(question => question.question.toLowerCase().indexOf(this.search_input.toLowerCase()) > -1)
			} else {
				this.filtered_data = this.data
			}
			if (this.filter_type == 'hot'){
				this.sortingParameters = ['deadline', 'asc']
				var filter = (minutes) => {
					const data = this.filtered_data.filter((question) => {
						if (moment.unix(question.deadline).isBetween(moment().subtract(minutes,'minutes'),moment().add(minutes,'minutes')))
							return true
						if (moment.unix(question.countdown).isBetween(moment().subtract(minutes,'minutes'),moment().add(minutes,'minutes')))
							return true
						return false;
					})

					if (this.filtered_data.length == data.length || data.length > 10)
						this.filtered_data = data
					else
						filter(minutes * 2)
				}
				filter(12*60)
			} else if (this.filter_type == 'reportable') {
					this.sortingParameters = ['deadline', 'asc']
					this.filtered_data = this.filtered_data.filter((question) => {
						return question.status == 'being_graded' || (moment.unix(question.deadline).isBefore(moment()) && question.status == 'created')
					})
			} else if (this.filter_type == 'pending') {
					this.sortingParameters = ['deadline', 'asc']
					this.filtered_data = this.filtered_data.filter((question) => {
						return question.status == 'created' && moment.unix(question.deadline).isAfter(moment())
					})
			} else if (this.filter_type == 'ended') {
					this.sortingParameters = ['deadline', 'desc']
					this.filtered_data = this.filtered_data.filter((question) => {
						return question.status == 'committed'
					})
			} else {
				this.sortingParameters = ['deadline', 'desc']
			}
			this.sort()
		},
		sort(){
			this.data.sort(function(a, b) {
				var time_a = a.status == 'created' ? a.deadline : a.countdown_start
				var time_b = b.status == 'created' ? b.deadline : b.countdown_start
				return time_b - time_a;
			});
			this.$nextTick(function () {
				this.$refs.table.initSort()
			})
		},
		getData: function(){
			this.axios.get('/api/questions').then((response) => {
				
				response.data.forEach((row)=>{
					if (row.status == 'created'){
						row.countdown = moment().to(moment.unix(row.deadline))
						if (moment().isAfter(moment.unix(row.deadline)))
							row.possibleAction = this.$t('questionsTableColumnReportNow')
						else
 							row.possibleAction = this.$t('questionsTableColumnNotReportableYet')
					}
					else if (row.status == 'being_graded'){
						row.countdown = moment().to(moment.unix(row.countdown_start + conf.challenge_period_in_days*24*3600))
						if (moment().isBefore(moment.unix(row.countdown_start + conf.challenge_period_in_days*24*3600 ))){
							row.possibleAction = this.$t('questionsTableColumnContestOutcome')
							row.beingGraded = true
							row.reward = row.staked_on_outcome - row.staked_on_opposite/conf.challenge_coeff
						}
						else {
							row.possibleAction = this.$t('questionsTableColumnCommitOutcome')
							row.reward = 0
						}
					} else if (row.status == 'committed'){
							row.countdown = moment().to(moment.unix(row.deadline));
							row.committed = true
							row.reward = 0
							const assocStakedByAdress =	row.staked_by_address
							const outcome = row.outcome
							for (var key in assocStakedByAdress){
								if (assocStakedByAdress[key][outcome]){
									row.possibleAction = this.$t('questionsTableColumnWithdraw')
									break;
								}
							}
					} else 
						row.countdown = moment().to(moment.unix(row.deadline)); // for unconfirmed questions

				});
				this.data = response.data;
				this.applyFilter();

			});
		},

		createQuestion() {
			this.$buefy.modal.open({
				parent: this,
				component: QuestionCreateModal,
				hasModalCard: true,
				width:"640",
				customClass: 'custom-class custom-class-2',
				onCancel:()=>{
					this.$router.push({ name: 'landingPage'});
					EventBus.$emit('refresh-questions');
				},
			})
		},

		setNickname() {
			this.$buefy.modal.open({
				parent: this,
				component: SetNicknameModal,
				hasModalCard: true,
				width:"640",
				customClass: 'custom-class custom-class-2',
				onCancel:()=>{
					this.$router.push({ name: 'landingPage'});
					EventBus.$emit('refresh-questions');
				},
			})
		},
	}
}
</script>

<style lang='scss' scoped>

</style>


