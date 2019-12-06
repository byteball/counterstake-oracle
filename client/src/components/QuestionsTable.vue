<template>
	<section>
			<b-table
					:data="data"
					@click="onClick"
					hoverable
					per-page
					class="questions-table"
					>
						<template slot-scope="props">

							<b-table-column field="question" label="Question" sortable>
								{{props.row.question}}
							</b-table-column>

							<b-table-column field="deadline" label="Deadline"  sortable>
								{{props.row.countdown}}
							</b-table-column>

							<b-table-column field="reward" label="Reward"  sortable>
								<byte-amount :amount="Number(props.row.reward)" />
							</b-table-column>

							<b-table-column field="outcome" label="Outcome">
								{{props.row.outcome || "Not known yet"}}
							</b-table-column>

							<b-table-column field="possibleAction" label="Action available">
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

export default {

	components: {
		ByteAmount
	},
	data() {
		return {
			data: [],

			timerId: null
		}
	},
	watch: {

	},
	created(){
		this.getData();
		this.timerId = setInterval(this.getData, 60000);
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
						if (moment().isBefore(moment.unix(Number(row.countdown_start) + conf.challenge_period_in_days*24*3600 )))
							row.possibleAction = "Contest outcome";
						else
							row.possibleAction = "Commit outcome";
					} else if (row.status == 'committed'){
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