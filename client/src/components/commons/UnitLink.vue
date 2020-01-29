<template>
	<span>
		<a target='_blank' :href="(isTestnet ? 'https://testnetexplorer.obyte.org/#' : 'https://explorer.obyte.org/#')+unit">
			<v-icon
				name="external-link"
				size="is-small"
				class="pt-05"
			/>
		</a>
	</span>
</template>

<script>
const conf = require("../../conf.js");

	export default {
		props: {
			unit: {
				type: String,
				required: true,
				default: null,
			}
		},
		data () {
			return {
				isTestnet: conf.testnet,
			}
		},
	}
</script>

<style lang='scss' scoped>

</style>
