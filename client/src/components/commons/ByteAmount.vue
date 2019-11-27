<template>
	<span>
		<span v-if="label"> {{label}}</span>
		<span v-bind:class="amountClass">{{(amount/gb_to_bytes).toPrecision(6)/1}} GB</span>
	</span>
</template>

<script>
const conf = require("../../conf.js");

export default {
	props: {
		amount: {
			type: Number,
			required: true
		},
		label: {
			type: String,
			required: false
		}
	},
	data(){
		return {
			gb_to_bytes: conf.gb_to_bytes
		}
	},
	computed:{
		amountClass:function(){
			return {
				default: true
			};
		}
	}
}
</script>

<style lang='scss' scoped>
.default{

}
</style>


