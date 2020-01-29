<template>
	<a :href="link">	<v-icon name='external-link' class="link-icon"/></a>
</template>

<script>

	export default {
		props: {
			link: {
				type: String,
				required: true
			},
		}
	}
</script>

<style lang='scss'>
	.link-icon {
		height: 3rem;
		width: 3rem;
		margin: 1rem;
		color: rgb(88, 74, 209);
	}
</style>
