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
			<div v-for="(item,index) in historyItems" class="columns history-tile" :key="item.operation_id">
				<div class="column is-1">	<h4 class="title is-4">{{historyItems.length - index}}</h4></div>

				<div class="column">
					<div v-if="item.event_type=='new_question'">
						<div><b>Created</b> - {{item.time}}</div>
						<div> Reward  <byte-amount :amount="Number(question.reward)"/></div>
							By <user :address="item.author_address" :nickname="item.author_nickname"/>
					</div>
					<div v-if="item.event_type =='stake' || item.event_type=='initial_stake'" >
						<span><b>{{item.event_type =='stake' ? 'Counter stake' : 'Initial stake'}} </b> - {{item.time}} </span>
						<div>
							<b><user :address="item.author_address" :nickname="item.author_nickname"/></b> staked <b>
								<byte-amount :amount="item.accepted_amount"/></b> on <b>{{item.stake_on}}</b>
						</div>
						<div class="columns is-multiline">
							<div class="column is-full">Resulting outcome: <b>{{item.new_outcome}}</b></div>
							<div v-if="item.expected_reward" class="column is-full">Expected reward: <b><byte-amount :amount="item.expected_reward"/></b></div>
							<div class="column is-half">Total staked on <b>yes</b>: <b><byte-amount :amount="Number(item.total_staked_on_yes)"/></b></div>
							<div class="column is-half">Total staked on <b>no</b>: <b><byte-amount :amount="Number(item.total_staked_on_no)"/></b></div>
						</div>
					</div>
					<div v-if="item.event_type =='commit'">
						<div cols="12">
							<span><b>Committed</b> - {{item.time}} </span>
							<div class="pt-2">
								<span v-if="item.paid_out_amount" class="d-block"><b><byte-amount :amount="item.paid_out_amount"/></b> paid to <b>{{item.paid_out_address}}</b></span>
							</div>
						</div>
					</div>
					<div v-if="item.event_type =='withdraw'" >
						<div cols="12">
							<span><b>Withdraw</b> - {{item.time}} </span>
							<div class="pt-2">
								<span v-if="item.paid_out_amount" class="d-block"><b><byte-amount :amount="item.paid_out_amount"/></b> paid to <b>{{item.paid_out_address}}</b></span>
							</div>
						</div>
					</div>
				</div>
				<hr>
			</div>
		</div>
	</b-collapse>	
</template>

<script>
const conf = require("../../conf.js");
import moment from 'moment/src/moment'
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
						item.total_staked_on_yes = Number(row.response['total_staked_on_yes']);
						item.total_staked_on_no = Number(row.response['total_staked_on_no']);
						item.time = moment.unix(row.timestamp).format('LLLL');
						item.stake_on = row.response.reported_outcome;
						item.accepted_amount = Number(row.response.your_stake) || Number(row.response.accepted_amount);
						item.new_outcome = row.response.new_outcome;
						item.paid_out_amount = Number(row.response.paid_out_amount);
						item.paid_out_address = row.response.paid_out_address;
						item.expected_reward = Number(row.response.expected_reward);
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
	max-height: 10rem;
	overflow: auto;
	}

	.history-tile{
		background-color: colors("light");
		margin-top: 1rem;
		margin-bottom: 1rem;
	}
</style>