<template>
	<div class="modal-card" style="min-width:400px;">
		<header class="modal-card-head">
			<p class="modal-card-title">{{$t('questionPendingModalTitle')}}</p>
		</header>
		<section class="modal-card-body">
			<h4 class="title is-4">{{question.question}}</h4>
			<hr>
			<div class="pt-1"><b>{{question.description}}</b></div>
			<div class="pt-1">{{$t('questionPendingReportingStart')}}<b>{{question.countdown}}</b></div>

			<div class="py-1">
				<div>{{$t('questionPendingOracleAddress')}}<b>{{conf.aa_address}}</b></div>
				<div>{{$t('questionPendingFeedName')}}<b>{{question.question_id}}</b></div>
				<div>
					<i18n path="questionPendingExpectedValue">
						<template #value_1>
							<b>yes</b>
						</template>
						<template #value_2>
							<b>no</b>
						</template>
					</i18n>
				</div>
			</div>
			<div class="py-1">
				<manage-option :question="question" />
			</div>
		</section>
		<footer class="modal-card-foot">
			<button class="button" type="button" @click="$emit('close')">{{$t('commonButtonClose')}}</button>
		</footer>
	</div>
</template>

<script>

const conf = require("../conf.js");
import ManageOption from './commons/ManageOption.vue';

export default  {
	components:{
		ManageOption
	},
	props: {
		question: {
			type: Object,
			required: false,
			default:  function () {
				return {}
			}
		}
	},
	data() {
		return {
			conf: conf
			}
		},
	created(){

	},
	methods:{

	}

}
</script>
