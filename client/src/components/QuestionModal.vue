<template>
	<form action="">
			<div class="modal-card" style="width: auto">
					<header class="modal-card-head">
							<p class="modal-card-title">Login</p>
					</header>
					<section class="modal-card-body">
{{question_id}}
					</section>
					<footer class="modal-card-foot">
							<button class="button" type="button" @click="$parent.close()">Close</button>
							<button class="button is-primary">Login</button>
					</footer>
			</div>
	</form>
</template>

<script>
	export default  {
		props: ['question_id']
	}
</script>
