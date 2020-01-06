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
					<b-icon :icon="isHistoryOpen ? 'angle-up' : 'angle-down'" />
				</a>
		</div>
		<div class="card-content scrollable">
			<div class="container">
					<div v-for="(item,index) in historyItems" class="row mt-1" :key="index">
						<div>
							<div class="box" v-if="item.event_type =='new_question'" >
								<div class="title is-6"><b>New question</b> - {{item.time}} </div>
								<div class="d-block text-break">
									Created by {{item.author_address}}
								</div>
							</div>
							<div class="box" v-if="item.event_type =='stake' || item.event_type=='initial_stake'" >
								<div class="title is-6"><b>{{item.event_type =='stake' ? 'Counter stake' : 'Initial stake'}} </b> - {{item.time}}</div>

								<div class="d-block text-break">
									<b><user :address="item.author_address" :nickname="item.author_nickname"/></b>
									staked <b><byte-amount :amount="item.accepted_amount"/></b> on <b>{{item.stake_on}}</b>
								</div>
								<span class="d-block">Resulting outcome: <b>{{item.new_outcome}}</b></span>
								<span v-if="item.expected_reward" class="d-block">Expected reward: <b><byte-amount :amount="item.expected_reward"/></b></span>
								<div class="progress-stacked mt-1">
									<div class="bar" :style="{ height: 15 + 'px', background: '#48c774', width: ( item.total_staked_on_yes * 100) / (item.total_staked_on_yes + item.total_staked_on_no) + '%' }">
										<byte-amount :amount="item.total_staked_on_yes"/>
									</div>
									<div class="bar" :style="{ height: 15 + 'px', background: '#f00', width: ( item.total_staked_on_no * 100) / (item.total_staked_on_yes + item.total_staked_on_no) + '%' }">
										<byte-amount :amount="item.total_staked_on_no"/>
									</div>
								</div>
							</div>
							<div class="box" v-if="item.event_type =='commit'" >
								<div class="title is-6"><b>Committed</b> - {{item.time}} </div>
								<div class="d-block text-break">
									<span v-if="item.paid_out_amount" class="d-block"><b><byte-amount :amount="item.paid_out_amount"/></b> paid to <b>{{item.paid_out_address}}</b></span>
								</div>
							</div>
							<div class="box" v-if="item.event_type =='withdraw'" >
								<div class="title is-6"><b>Withdraw</b> - {{item.time}} </div>
								<div class="d-block text-break">
									<span v-if="item.paid_out_amount" class="d-block"><b><byte-amount :amount="item.paid_out_amount"/></b> paid to <b>{{item.paid_out_address}}</b></span>
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

export default {	
	components: {
		ByteAmount,
		User
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
				this.isSpinnerActive = true;
		this.historyItems= []
				this.axios.get('/api/question-history/'+encodeURIComponent(this.question.question_id)).then((response) => {
					response.data.forEach((row)=>{
						const item = {};
						item.event_type = row.event_type;
						item.author_address = row.response.your_address;
						item.author_nickname = row.response.nickname;
						item.total_staked_on_yes = row.response['total_staked_on_yes'] || 0;
						item.total_staked_on_no = row.response['total_staked_on_no'] || 0;
						item.time = moment.unix(row.timestamp).format('LLLL');
						item.stake_on = row.response.reported_outcome;
						item.accepted_amount = row.response.your_stake || row.response.accepted_amount;
						item.new_outcome = row.response.new_outcome;
						item.paid_out_amount = row.response.paid_out_amount;
						item.paid_out_address = row.response.paid_out_address;
						item.expected_reward = row.response.expected_reward;
						this.historyItems.push(item);
						this.isSpinnerActive = false;
					});
					console.log(this.historyItems);
				});
			}
		}
}
</script>

<style lang='scss' scoped>
.scrollable{
	max-height: 12rem;
	overflow: auto;
}

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