<template>
	<form action="">
			<div class="modal-card" style="width: auto">
					<header class="modal-card-head">
							<p class="modal-card-title">Question</p>
					</header>
					<section class="modal-card-body">
						{{question.question}}
						{{history}}
					</section>
					<footer class="modal-card-foot">
							<button class="button" type="button" @click="$router.push({ name: 'landingPage'});$parent.close();">Close</button>
					</footer>
			</div>
	</form>
</template>

<script>
	export default  {
		props: ['propQuestion','propQuestionId'],

	data() {
		return {
				question: {},
				history: []
			}
		},

		created(){
			if (this.propQuestion){
				console.log("prop question");
				this.question = this.propQuestion;
			} else if (this.propQuestionId){
				this.axios.get('/api/question/'+this.propQuestionId).then((response) => {
					this.question = response.data;
				});
			}
				this.axios.get('/api/question-history/'+this.propQuestionId || this.propQuestion.key).then((response) => {

					this.history = response.data;
				});

				

		}
	}
</script>
