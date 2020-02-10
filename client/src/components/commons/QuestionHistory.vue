<template>
	<b-collapse :open.sync="isHistoryOpen" class="card" aria-id="contentIdForA11y3">
		<div
				slot="trigger" 
				class="card-header"
				role="button"
				aria-controls="contentIdForA11y3">
				<p class="card-header-title">
					History - {{historyItems.length}} event{{historyItems.length>1 ? "s" :""}}
				</p>
				<a class="card-header-icon">
					<v-icon :name="isHistoryOpen ? 'chevron-up' : 'chevron-down'" />
				</a>
		</div>
		<div class="card-content">
			<div class="container">
					<div v-for="(item,index) in historyItems" class="row mt-1" :key="index">
						<div>
							<div class="box" v-if="item.event_type =='new_question'" >
								<div class="title is-6"><b>{{$t('questionHistoryNewQuestion')}}</b> - {{item.time}}
									- {{$t('questionHistoryUnit')}} <unit-link :unit="item.unit"/>
								 </div>
								<div>

									<i18n path="questionHistoryCreatedBy">
										<template #author>
											<b><user :address="item.concerned_address" :nickname="item.concerned_address_nickname"/></b>
										</template>
									</i18n>
								</div>
							</div>
							<div class="box" v-if="item.event_type == 'stake' || item.event_type == 'initial_stake'" >
								<div class="title is-6"><b>{{item.event_type =='stake' ? $t('questionCounterStake') : $t('questionInitialStake')}} </b> - {{item.time}}
									- {{$t('questionHistoryUnit')}} <unit-link :unit="item.unit"/>
								</div>
							<div>
								<i18n path="questionHistoryUserStakedOn">
									<template #user>
										<b><user :address="item.concerned_address" :nickname="item.concerned_address_nickname"/></b>
									</template>
									<template #amount>
										<b><byte-amount :amount="item.paid_in"/></b>
									</template>
									<template #side>
										<b>{{item.event_data.reported_outcome}}</b>
									</template>
								</i18n>
							</div>
								<span>{{$t('questionHistoryResultingOutcome')}}<b>{{item.event_data.resulting_outcome}}</b></span>
								<span v-if="item.expected_reward" class="d-block">{{$t('questionHistoryExpectedReward')}}<b><byte-amount :amount="item.expected_reward"/></b></span>
								<div class="progress-stacked mt-1">
									<div class="bar" :style="{ height: 15 + 'px', background: '#48c774', width: ( item.event_data.staked_on_yes * 100) / (item.event_data.staked_on_yes + item.event_data.staked_on_no) + '%' }">
										<byte-amount :amount="item.event_data.staked_on_yes"/>
									</div>
									<div class="bar" :style="{ height: 15 + 'px', background: '#f00', width: ( item.event_data.staked_on_no * 100) / (item.event_data.staked_on_yes + item.event_data.staked_on_no) + '%' }">
										<byte-amount :amount="item.event_data.staked_on_no"/>
									</div>
								</div>
							</div>
							<div class="box" v-if="item.event_type =='commit'" >
								<div class="title is-6"><b>{{$t('questionHistoryCommitted')}}</b> - {{item.time}} 
									- {{$t('questionHistoryUnit')}} <unit-link :unit="item.unit"/>
								</div>
								<div class="d-block" v-if="item.paid_out">
									<i18n path="questionHistoryPaidTo">
										<template #amount>
											<b><byte-amount :amount="item.paid_out"/></b>
										</template>
										<template #user>
											<b>{{item.concerned_address}}</b>
										</template>
									</i18n>
								</div>
							</div>
							<div class="box" v-if="item.event_type =='withdraw'" >
								<div class="title is-6"><b>{{$t('questionHistoryWithdrawal')}}</b> - {{item.time}} 
									- {{$t('questionHistoryUnit')}} <unit-link :unit="item.unit"/>
								</div>
								<div class="d-block text-break">
									<i18n path="questionHistoryPaidTo">
										<template #amount>
											<b><byte-amount :amount="item.paid_out"/></b>
										</template>
										<template #user>
											<b>{{item.concerned_address}}</b>
										</template>
									</i18n>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
	</b-collapse>	
</template>

<script>
const conf = require("../../conf.js");
import moment from 'moment'
import ByteAmount from './ByteAmount.vue';
import User from './User.vue';
import UnitLink from './UnitLink.vue'

export default {	
	components: {
		ByteAmount,
		User,
		UnitLink
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
	data(){
		return {
			historyItems: [],
			isSpinnerActive: false,
			isHistoryOpen: false
		}
	},
	created(){
		this.historyItems= [];
		this.getHistory();
	},
	methods:{
		getHistory(){
			this.isSpinnerActive = true
			this.historyItems = []
			this.axios.get('/api/question-history/'+this.question.question_id).then((response) => {
				response.data.forEach((row)=>{
					row.time = moment.unix(row.timestamp).format('LLLL');
					row.event_data.accepted_amount = row.event_data.your_stake || row.event_data.accepted_amount; // to be changed with new AA
				});
				this.historyItems = response.data;
				this.isSpinnerActive = false;
			});
		}
	}
}
</script>

<style lang='scss' scoped>
.history-tile{
	background-color: colors("light");
	margin-top: 1rem;
	margin-bottom: 1rem;
}

.event-block{
background-color: gainsboro;
}
.progress-stacked {
display: flex;
border-radius: 4px;
overflow: hidden;
.bar {
	position: relative;
	& > span {
		display: block;
		text-align: center;
		line-height: 15px;
		font-weight: bold;
		color: #fff;
	}
}
	}
</style>