<template>
	<section>
			<b-table
					:data="data"
					:columns="columns"
					:selected.sync="selected"
					hoverable
					>



			
			</b-table>
	</section>
</template>

<script>


const conf = require("../conf.js");

export default {

	components: {
		
	},
	data() {
		return {
			data: [],
			selected: null,
			columns: [
				{
					field: 'question',
					label: 'Question',
					searchable: true,
				},
				{
					field: 'deadline',
					label: 'Deadline',
					searchable: false,
				},
				{
					field: 'reward',
					label: 'Reward',
					searchable: false,
				},
				{
					field: 'status',
					label: 'Status',
					searchable: false,
				}
		]
		}
	},
	watch: {
		selected: function(item){
			if (item){
				this.selected = null;
			this.$router.push({ name: 'landingPageQuestion', params: { question_id: item.key, question: item } })
			}
		}
	},
	created(){
			this.axios.get('/api/questions').then((response) => {
				this.data = response.data;
			});
	},
	methods: {
onRowClick: function(value){



}
	}
}
</script>