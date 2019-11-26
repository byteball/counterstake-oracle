import Vue from 'vue'
import Router from 'vue-router'
import lazyLoading from './lazyloading'

Vue.use(Router)

export default new Router({
	mode: 'history',

	routes: [
		{
			name: 'landingPageQuestion',
			path: '/question/:question_id',
			component: lazyLoading('components/LandingPage'),
			props: true,
		},
		{
			name: 'landingPage',
			path: '/',
			component: lazyLoading('components/LandingPage'),
			default: true,
		}
	],
})
