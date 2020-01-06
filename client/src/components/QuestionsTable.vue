<template>
	<section>
			<b-table
					:data="data"
					@click="onClick"
					hoverable
					paginated
					:per-page="15"
					class="questions-table"
					:row-class="row => !row.is_pending ? 'active' : 'pending' "
					>
						<template slot-scope="props">

							<b-table-column field="question" label="Question" sortable searchable>
								{{props.row.question}}
								<pending-actions :pendingActions="props.row.pendingActions" />
							</b-table-column>

							<b-table-column field="deadline" label="Report time" sortable>
								{{props.row.countdown}}
							</b-table-column>

							<b-table-column field="reward" label="Reward"  sortable>
								<byte-amount :amount="props.row.reward" />
							</b-table-column>

							<b-table-column field="outcome" label="Outcome">
								<b-tag v-if = "props.row.outcome" :class="{
									'is-warning': props.row.beingGraded,
									'is-success' : !props.row.beingGraded 
									 }">{{props.row.outcome}}</b-tag>
								<span v-else>Not known yet</span>
							</b-table-column>

							<b-table-column field="possibleAction" label="Action available" sortable>
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
import PendingActions from './commons/PendingActions.vue';

import { EventBus } from './../event-bus.js';

export default {

	components: {
		ByteAmount,
		PendingActions
	},
	data() {
		return {
			data: [],
			timerId: null
		}
	},
	watch: {

	},
	computed: {

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
			this.selected = null;
			this.$router.push({ name: 'landingPageQuestion', params: { question_id: item.question_id, question: item } })
		},
		getData: function(){
			this.axios.get('/api/questions').then((response) => {
				response.data.forEach(function(row){
					row.countdown = moment().to(moment.unix(row.deadline));
					if (row.status == 'created'){
						if (moment().isAfter(moment.unix(row.deadline)))
							row.possibleAction = 'Report now!';
						else if (row.yes_before_deadline)
							row.possibleAction = "Reportable as yes";
						else
 							row.possibleAction = "Not reportable yet";
					}
					else if (row.status == 'being_graded'){
						if (moment().isBefore(moment.unix(row.countdown_start + conf.challenge_period_in_days*24*3600 ))){
							row.possibleAction = "Contest outcome";
							row.beingGraded = true;
						}
						else
							row.possibleAction = "Commit outcome";
					} else if (row.status == 'committed'){
							row.committed = true;
							const assocStakedByAdress =	row.staked_by_address;
							const outcome = row.outcome
							for (var key in assocStakedByAdress){
								if (assocStakedByAdress[key][outcome]){
									row.possibleAction = "Withdraw";
									break;
								}
							}
					}
				});
				this.data = response.data;
			});
		}
	}
}
</script>