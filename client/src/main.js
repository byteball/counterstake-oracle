import '@babel/polyfill'
import 'mutationobserver-shim'
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import feather from 'vue-icon'

import axios from 'axios'
import VueAxios from 'vue-axios'

import "@/assets/custom.scss"
import i18n from './i18n'
import store from './store'

import Buefy from 'buefy'

/*
import { library } from '@fortawesome/fontawesome-svg-core';
// internal icons
import { faCheck, faCheckCircle, faInfoCircle, faExclamationTriangle, faExclamationCircle,
    faArrowUp, faAngleRight, faAngleLeft, faAngleDown,faAngleUp,
    faEye, faEyeSlash, faCaretDown, faCaretUp, faUpload, } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faCheck, faCheckCircle, faInfoCircle, faExclamationTriangle, faExclamationCircle,
    faArrowUp, faAngleRight, faAngleLeft, faAngleDown,faAngleUp,
    faEye, faEyeSlash, faCaretDown, faCaretUp, faUpload);
Vue.component('vue-fontawesome', FontAwesomeIcon);
*/
Vue.use(Buefy);
Vue.use(VueAxios, axios);
Vue.use(feather, 'v-icon');

Vue.config.productionTip = false;

new Vue({
    el: '#app',
    router,
    i18n,
    store,
    render: h => h(App)
})