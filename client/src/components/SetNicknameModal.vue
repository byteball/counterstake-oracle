<template>
	<form action="">
		<div class="modal-card" style="min-width:400px;">
			<header class="modal-card-head">
				<p class="modal-card-title">{{$t('setNicknameModalTitle')}}</p>
			</header>
			<section  class="modal-card-body" >
				<div v-show ="!link" ref="div-create" class="p-2">
					<b-field :label="$t('setNicknameLabelField')"  :message="nickname_input_message">
						<b-input 
						v-model="nickname" 
						:maxlength="conf.nickname_max_length"
						:minlength="conf.nickname_min_length"
						@input='onNicknameChanged' 
						ref="input-nickname" 
						/>
					</b-field>
				</div>
				<div v-if="link" ref="div-link">
					<div>
						<b>{{$t('setNicknameNewNickname')}} {{nickname}}</b>
					</div>
					<p class="mt-2">{{$t('setNicknameLinkHeader')}}</p>
						<icon-link :link="link" />
					<p class="mt-1 pb-5">{{$t('setNicknameLinkFooter')}}</p>
				</div>
			</section>

			<footer class="modal-card-foot">
				<button class="button is-primary" v-if="link" @click="link=null">{{$t('commonButtonBack')}}</button>
				<button class="button" type="button" @click="closeAndRefresh">{{$t('commonButtonClose')}}</button>
				<button v-if="isButtonOkVisible && !link" class="button is-primary" @click="handleOk" ref="button-create">{{$t('commonButtonCreateLink')}}</button>
			</footer>
		</div>
	</form>
</template>

<script>

const conf = require("../conf.js");
import ByteAmount from './commons/ByteAmount.vue';
import { EventBus } from './../event-bus.js';
import IconLink from './commons/IconLink.vue'

export default {
	components: {
		IconLink
	},
	data() {
		return {
			nickname: "",
			nickname_input_message: null,
			conf: conf,
			isButtonOkVisible: false,
			link: null
		}
	},
	created(){

	},
	methods:{
		onNicknameChanged : function(value){
			this.isButtonOkVisible = value.length >= conf.nickname_min_length && value.length <= conf.nickname_max_length
		},
		closeAndRefresh: function(){
			EventBus.$emit('refresh-questions');
			this.$parent.close()
		},
		handleOk(bvModalEvt){
			bvModalEvt.preventDefault()	;
			const data = {
				nickname: this.nickname
			}

			const json_string = JSON.stringify(data);
			const base64data = encodeURIComponent(btoa(json_string));
			this.link = conf.protocol+":"+conf.aa_address+"?amount=10000&base64data="+base64data;
		}
	}
}
</script>
