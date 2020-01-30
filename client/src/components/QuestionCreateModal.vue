<template>
	<form action="">
		<div class="modal-card" style="min-width:400px;">
			<header class="modal-card-head">
				<p class="modal-card-title">{{$t('questionCreateModalTitle')}}</p>
			</header>
			<section  class="modal-card-body" >
				<div v-show ="!link" ref="div-create" class="p-2">
					<b-field :label="$t('questionCreateModalLabelFieldQuestion')"  :message="question_input_message">
						<b-input v-model="question" :maxlength="conf.question_max_length" @input='onQuestionChanged' ref="input-question"></b-input>
					</b-field>
					<p>{{$t('questionCreateModalQuestionRequirements',{min_length:conf.question_min_length})}}</p>

					<b-field class="mt-2" label="Optional description" :message="description_input_message">
						<b-input v-model="description" :maxlength="conf.description_max_length" type="textarea"  @input='onDescriptionChanged' ref="input-description" ></b-input>
					</b-field>

					<b-field :label="$t('questionCreateModalSetDeadline')" class="mt-1">
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
					<b-field label="Reward amount" class="mt-3">
						<b-slider v-model="amount" 
						:min="conf.min_reward_for_AA_gb" 
						:max="conf.min_reward_for_website_gb*100" 
						:step="conf.min_reward_for_AA_gb"
						:type="amount>=conf.min_reward_for_website_gb ? 'is-success' : 'is-danger'"
						:custom-formatter="val => val + ' GB'">
						</b-slider>
					</b-field>
					<byte-amount :amount="Math.round(amount*conf.gb_to_bytes)" ref="reward-amount"/>
					<p v-if="amount<conf.min_reward_for_website_gb">{{$t('questionCreateModalAmountTooLowForWebsite',{amount:conf.min_reward_for_website_gb})}}</p>
				</div>
				<div v-if="link" ref="div-link">
					<h4 class="title is-4">{{question}}</h4>
					<div>
						<b>Deadline: {{isUtcTime ? deadline.toUTCString() : deadline}}</b>
					</div>
					<div>
						<b>Reward: <byte-amount :amount="Math.round(amount*conf.gb_to_bytes)"/></b>
					</div>
					<p class="mt-2">{{$t('questionCreateModaLinkHeader')}}</p>
						<wallet-link :link="link" />
					<p class="mt-1 pb-5">{{$t('questionCreateModaLinkFooter')}}</p>
				</div>
			</section>

			<footer class="modal-card-foot">
				<button class="button is-primary" v-if="link" @click="link=null">{{$t('commonButtonBack')}}</button>
				<button class="button" type="button" @click="closeAndRefresh">Close</button>
				<button v-if="isButtonOkVisible && !link" class="button is-primary" @click="handleOk" ref="button-create">Create link</button>
			</footer>
		</div>
	</form>
</template>

<script>

const conf = require("../conf.js");
import ByteAmount from './commons/ByteAmount.vue';
import { EventBus } from './../event-bus.js';
import WalletLink from './WalletLink.vue'

	export default  {
	components: {
		ByteAmount,
		WalletLink
	},
	data() {
		return {
			question: "",
			question_input_message: null,
			description: "",
			description_input_message: null,
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
				this.minDateTime = this.convertUtcDateToLocal(this.minDateTime);
			}
		}

	},
	created(){
		this.minDateTime.setSeconds(this.minDateTime.getSeconds() + conf.min_delay_from_now);
		this.deadline = this.minDateTime;
	},
	methods:{
		closeAndRefresh: function(){
			EventBus.$emit('refresh-questions');
			this.$parent.close()
		},
		onQuestionChanged : function(value){
			if (value.indexOf('_') > -1){
				this.question_input_message = "Question cannot contain underscore"
				this.question = value.replace('_',' ')
			} else {
				this.question_input_message = null
			}
			this.isButtonOkVisible = value.length >= conf.question_min_length;
		},
		onDescriptionChanged : function(value){
			if (value.indexOf('_') > -1){
				this.description_input_message = "Description cannot contain underscore"
				this.description = value.replace('_',' ')
			} else {
				this.description_input_message = null
			}
		},
		convertLocalDateToUTC(date) {
			return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
		},
		convertUtcDateToLocal(date) {
			var offset = new Date().getTimezoneOffset();
			return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes() - offset, date.getSeconds());
		},
		handleOk(bvModalEvt){
			bvModalEvt.preventDefault()	;
			const base64url = require('base64url');
			const data = {
					question: this.question,
					deadline: this.deadline.toISOString().slice(0,-5)
			}
			if (this.description.length > 0 )
				data.description = this.description

			const json_string = JSON.stringify(data);
			const base64data = base64url(json_string);
			this.link = (conf.testnet ? "byteball-tn" :"byteball")+":"+conf.aa_address+"?amount="
				+Math.round(this.amount * conf.gb_to_bytes)+"&base64data="+base64data;
		}
	}
}
</script>
