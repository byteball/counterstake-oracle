<template>
	<div class="is-inline">
		<b-tooltip  v-if="nickname" :label="address" position="is-right">{{nickname}}</b-tooltip>
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
