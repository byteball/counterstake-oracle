<template>
	<div class="d-inline">
		<span v-if="nickname" v-b-tooltip.hover :title="address">{{nickname}}</span>
		<span v-else>{{address}}</span>
	</div>
</template>

<script>

export default {	
	props: {
		nickname: {
			type: String,
			required: false,
			default: null
		},
		address: {
			type: String,
			required: true
		}
	}
}
</script>

<style lang='scss' scoped>

</style>
