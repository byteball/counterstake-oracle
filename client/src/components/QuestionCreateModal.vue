<template>
	<form action="">
		<div class="modal-card" style="min-height:900px;">
			<header class="modal-card-head">
					<p class="modal-card-title">{{$t('questionCreateModalTitle')}}</p>
			</header>
			<section class="modal-card-body" >
				<div v-if="!link" style="padding:20px;">
					<b-field :label="$t('questionCreateModalLabelFieldQuestion')">
							<b-input v-model="question" :maxlength="conf.question_max_length" @input='onQuestionChanged'></b-input>
					</b-field>
					<p>{{$t('questionCreateModalQuestionRequirements',{min_length:conf.question_min_length})}}</p>

					<b-field :label="$t('questionCreateModalSetDeadline')" style="margin-top:30px;">
							<b-datetimepicker
								rounded
								v-model="deadline"
								:datepicker="{ showWeekNumber:false }"
								:min-datetime="minDateTime"
								:timepicker="{ hourFormat: format }">
							</b-datetimepicker>
					</b-field>
					<b-field grouped group-multiline>
						<div class="control">
								<b-switch v-model="formatAmPm">AM/PM</b-switch>
						</div>
						<div class="control">
							<b-switch v-model="isUtcTime">UTC time</b-switch>
						</div>
					</b-field>
					<b-field label="Reward amount" style="margin-top:30px;">
						<b-slider v-model="amount" 
						:min="conf.min_reward_for_AA_gb" 
						:max="conf.min_reward_for_website_gb*100" 
						:step="conf.min_reward_for_AA_gb"
						:type="amount>=conf.min_reward_for_website_gb ? 'is-success' : 'is-danger'"
						:custom-formatter="val => val + ' GB'">
						</b-slider>
					</b-field>
					<byte-amount :amount="Math.round(amount*conf.gb_to_bytes)"/>
					<p v-if="amount<conf.min_reward_for_website_gb">{{$t('questionCreateModalAmountTooLowForWebsite',{amount:conf.min_reward_for_website_gb})}}</p>
				</div>
				<div v-else>
					<h4 class="title is-4">{{question}}</h4>
					<h5 class="title is-5">Deadline: {{isUtcTime ? deadline.toUTCString() : deadline}}</h5>
					<h5 class="title is-5">Reward: <byte-amount :amount="Math.round(amount*conf.gb_to_bytes)"/></h5>

					<p>{{$t('questionCreateModaLinkHeader')}}</p>
					<a :href="link">{{link}}</a>
					<p>{{$t('questionCreateModaLinkFooter')}}</p>
				</div>
			</section>

			<footer class="modal-card-foot">
				<button class="button" type="button" @click="$parent.close()">Close</button>
				<button v-if="isButtonOkVisible" class="button is-primary" @click="handleOk">Ok</button>
			</footer>
		</div>
	</form>
</template>

<script>

const conf = require("../conf.js");
import ByteAmount from './commons/ByteAmount.vue';

	export default  {
	components: {
		ByteAmount
	},
	data() {
		return {
			question: "",
			isUtcTime: false,
			formatAmPm: false,
			conf: conf,
			amount: conf.min_reward_for_website_gb,
			minDateTime: new Date(),
			deadline: new Date(),
			isButtonOkVisible: false,
			link: null
		}
	},
	computed: {
		format() {
				return this.formatAmPm ? '12' : '24'
		}
	},
	watch:{
		isUtcTime: function(value){
			if (value){
				this.deadline = this.convertLocalDateToUTC(this.deadline);
				this.minDateTime =  this.convertLocalDateToUTC(this.minDateTime);
			} else {
				this.deadline = this.convertUtcDateToLocal(this.deadline);
				this.minDateTime =  this.convertUtcDateToLocal(this.minDateTime);
			}
		}

	},
	created(){
		this.minDateTime.setSeconds(this.minDateTime.getSeconds() + conf.min_delay_from_now);
		this.deadline = this.minDateTime;
	},
	methods:{
		onQuestionChanged : function(value){
			this.isButtonOkVisible = value.length >= conf.question_min_length;
		},
		convertLocalDateToUTC(date) {
			return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
		},
		convertUtcDateToLocal(date) {
			var offset = new Date().getTimezoneOffset();
			console.log(offset);
			return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes() - offset, date.getSeconds());
		},
		handleOk(bvModalEvt){
			bvModalEvt.preventDefault()	;
			const base64url = require('base64url');
			const data = {
					question: this.question,
					deadline: Math.round(this.deadline.getTime()/1000)
			};

			const json_string = JSON.stringify(data);
			const base64data = base64url(json_string);
			this.link = (conf.testnet ? "byteball-tn" :"byteball")+":"+conf.aa_address+"?amount="
				+(this.amount * conf.gb_to_bytes)+"&base64data="+base64data;
			this.isButtonOkVisible = false;
		}
	}
}
</script>
