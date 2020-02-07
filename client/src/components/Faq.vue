<template>
		<section>
			<div class="container">

				<b-collapse
						class="card"
						v-for="(collapse, index) of collapses"
						:key="index"
						:open="isOpen == index"
						@open="isOpen = index">
					<div
							slot="trigger"
							slot-scope="props"
							class="card-header"
							role="button">
						<p class="card-header-title">
							{{ collapse.title }}
						</p>
						<a class="card-header-icon">
							<b-icon size="is-small" :icon="props.open ? 'arrow-down' : 'arrow-up'"></b-icon>
						</a>
					</div>
					<div class="card-content">
						<div class="content" v-html="collapse.text"></div>
					</div>
				</b-collapse>
			</div>
		</section>
</template>

<script>
const conf = require('../conf.js')

export default {
	components: {
	},
	data () {
		return {
			conf: conf,
			isOpen: 0,
			collapses:[]
		}
	},
	created () {
		this.loadFaq()
	},
	methods:{

		loadFaq: function(){
			this.collapses= []
			for (var i=0; i < this.$t('faq').length; i++)
				this.collapses.push({
					title: this.$t('faq['+i+'].title'),
					text: this.$t('faq['+i+'].text', {
						github: conf.github
					}),
				})
		}
	}
}
</script>

<style lang='scss' scoped>


</style>
