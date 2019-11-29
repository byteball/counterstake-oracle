<template>
	<div>
		<div v-if="!isSpinnerActive">
			<div v-for="item in historyItems" style="margin-top:15px;" :key="item.operation_id">
			<div v-if="item.event_type=='new_question'">
				<div><b>Created</b> - {{item.time}}</div>
				<div> Reward  <byte-amount :amount="question.reward"/></div>
					By <user :address="item.author_address" :nickname="item.author_nickname"/>
			</div>
			<div v-if="item.event_type =='stake' || item.event_type=='initial_stake'" >

					<span ><b>{{item.event_type =='stake' ? 'Counter stake' : 'Initial stake'}} </b> - {{item.time}} </span>
					<div class="pt-2">
						<span class="d-block text-break"><b><user :address="item.author_address" :nickname="item.author_nickname"/></b> staked <b><byte-amount :amount="item.accepted_amount"/></b> on <b>{{item.stake_on}}</b></span>
						<span class="d-block">Resulting outcome: <b>{{item.resulting_outcome}}</b></span>
						<span v-if="item.expected_reward" class="d-block">Expected reward: <b><byte-amount :amount="item.expected_reward"/></b></span>
						<byte-amount :amount="item.staked_on_yes"/>
						<byte-amount :amount="item.staked_on_no"/>
					</div>
			<div v-if="item.operation_type =='commit'">
				<div cols="12">
					<span class="d-block event-block"><b>Committed</b> - {{item.time}} </span>
					<div class="pt-2">
						<span v-if="item.paid_out_amount" class="d-block"><b><byte-amount :amount="item.paid_out_amount"/></b> paid to <b>{{item.paid_out_address}}</b></span>
					</div>
				</div>
			</div>
				<div v-if="item.operation_type =='withdraw'" >
					<div cols="12">
						<span class="d-block event-block"><b>Withdraw</b> - {{item.time}} </span>
						<div class="pt-2">
							<span v-if="item.paid_out_amount" class="d-block"><b><byte-amount :amount="item.paid_out_amount"/></b> paid to <b>{{item.paid_out_address}}</b></span>
						</div>
					</div>
				</div>
			</div>
		</div>
			</div>
		<div v-if="isSpinnerActive" class="text-center w-100">
			<b-progress></b-progress>
		</div>
	</div>
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
		}
	},
	created(){
		this.historyItems= [];
		this.getHistory();
	},
	methods:{
		getHistory(){
				this.isSpinnerActive = true;
console.log(this.question);
		this.historyItems= []
									this.axios.get('/api/question-history/'+this.question.question_id).then((response) => {
					response.data.forEach((row)=>{
						const item = {};
						item.event_type = row.event_type;
						item.author_address = row.response.your_address;
						item.author_nickname = row.response.nickname;
						item.staked_on_yes = Number(row.response['staked_on_yes']);
						item.staked_on_no = Number(row.response['staked_on_no']);
						item.time = moment.unix(row.timestamp).format('LLLL');
						item.stake_on = row.response.reporting;
						item.accepted_amount = Number(row.response.accepted_amount);
						item.resulting_outcome = row.response.outcome;
						item.paid_out_amount = Number(row.response.paid_out_amount);
						item.paid_out_address = row.response.paid_out_address;
						item.expected_reward = Number(row.response.expected_reward);
						this.historyItems.push(item);
						this.isSpinnerActive = false;
					});
				});
			}
		}
}
</script>

<style lang='scss' scoped>
.event-block{
	background-color: gainsboro;
}
</style>