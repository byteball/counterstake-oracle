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
								<div class="title is-6"><b>New question</b> - {{item.time}}
									- Unit: <unit-link :unit="item.unit"/>
								 </div>
								<div class="d-block text-break">
									Created by {{item.concerned_address}}
								</div>
							</div>
							<div class="box" v-if="item.event_type =='stake' || item.event_type=='initial_stake'" >
								<div class="title is-6"><b>{{item.event_type =='stake' ? 'Counter stake' : 'Initial stake'}} </b> - {{item.time}}
									- Unit: <unit-link :unit="item.unit"/>
								</div>

								<div class="d-block text-break">
									<b><user :address="item.author_address" :nickname="item.author_nickname"/></b>
									staked <b><byte-amount :amount="item.paid_in"/></b> on <b>{{item.event_data.reported_outcome}}</b>
								</div>
								<span class="d-block">Resulting outcome: <b>{{item.event_data.resulting_outcome}}</b></span>
								<span v-if="item.expected_reward" class="d-block">Expected reward: <b><byte-amount :amount="item.expected_reward"/></b></span>
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
								<div class="title is-6"><b>Committed</b> - {{item.time}} 
									- Unit: <unit-link :unit="item.unit"/>
								</div>
								<div class="d-block text-break">
									<span v-if="item.paid_out" class="d-block"><b><byte-amount :amount="item.paid_out"/></b> paid to <b>{{item.concerned_address}}</b></span>
								</div>
							</div>
							<div class="box" v-if="item.event_type =='withdraw'" >
								<div class="title is-6"><b>Withdraw</b> - {{item.time}} 
									- Unit: <unit-link :unit="item.unit"/>
								</div>
								<div class="d-block text-break">
									<span v-if="item.paid_out" class="d-block"><b><byte-amount :amount="item.paid_out"/></b> paid to <b>{{item.concerned_address}}</b></span>
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
			this.axios.get('/api/question-history/'+encodeURIComponent(this.question.question_id)).then((response) => {
				response.data.forEach((row)=>{
					row.time = moment.unix(row.timestamp).format('LLLL');
					row.event_data.accepted_amount = row.event_data.your_stake || row.event_data.accepted_amount; // to be changed with new AA
				});
				this.historyItems = response.data;
				this.isSpinnerActive = false;
			});
			console.log(this.historyItems);
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