import { shallowMount, createLocalVue } from '@vue/test-utils'
import QuestionCreateModal from '../src/components/QuestionCreateModal.vue'
import Buefy from 'buefy'
const conf = require("./../src/conf.js")
import { parseWalletUrl } from './utils.js'

const localVue = createLocalVue()

localVue.use(Buefy)

describe('QuestionCreateModal', () => {

	const wrapper = shallowMount(QuestionCreateModal, {
		mocks: {
			$t: m => m
		},
		localVue
	})

	const expectedDeadline = Math.round(new Date().getTime() / 1000) + conf.min_delay_from_now
	const question = 'This is a question'

  it('is question creation visible', () => {
		const divCreate = wrapper.find({ ref: 'div-create' })
		expect(divCreate.exists()).to.be.true
		const divLink = wrapper.find({ ref: 'div-link' })
		expect(divLink.exists()).to.be.false
	})
	
	it('is min reward correct', () => {
		const rewardAmountCell = wrapper.find({ ref: 'reward-amount' })
		expect(rewardAmountCell.exists()).to.be.true
		expect(rewardAmountCell.html()).to.be.string('<byte-amount-stub amount="10000000"></byte-amount-stub>')
	})
	
	it('is button create not visible', () => {
		const buttonCreate = wrapper.find({ ref: 'button-create' })
		expect(buttonCreate.exists()).to.be.false
	})

	it('is reward correct updated', async () => {
		const rewardAmountCell = wrapper.find({ ref: 'reward-amount' })
		expect(rewardAmountCell.exists()).to.be.true
		wrapper.setData({amount: 0.8})
		await localVue.nextTick()
		expect(rewardAmountCell.html()).to.be.string('<byte-amount-stub amount="800000000"></byte-amount-stub>')
	})

  it('is button create visible when question is set', async() => {
		const inputQuestion = wrapper.find({ ref: 'input-question' })
		wrapper.setData({question })
		inputQuestion.vm.$emit('input', question )
		await localVue.nextTick()
		const buttonCreate = wrapper.find({ ref: 'button-create' })
		expect(buttonCreate.exists()).to.be.true
	})

	it('is link visible after clicking ok', async() => {
		const buttonCreate = wrapper.find({ ref: 'button-create' })
		buttonCreate.trigger('click')
		await localVue.nextTick()
		const divCreate = wrapper.find({ ref: 'div-create' })
		expect(divCreate.exists()).to.be.false
		const divLink = wrapper.find({ ref: 'div-link' })
		expect(divLink.exists()).to.be.true
	})

	it('is url correct', async() => {

		const divLink = wrapper.find({ ref: 'div-link' })
		expect(divLink.exists()).to.be.true
		console.log(divLink)
		console.log(divLink.find('a').text())
		const parsedUrl = parseWalletUrl(divLink.find('a').text())
		expect(parsedUrl.amount).to.be.equal(800000000)
		expect(parsedUrl.recipient).to.be.string(conf.aa_address)
		expect(parsedUrl.network).to.be.string(conf.testnet ? 'byteball-tn' : 'byteball')
		console.log(JSON.stringify(parsedUrl.data))
		console.log(parsedUrl.data.question)

		expect(parsedUrl.data.question).to.be.string(question)
		expect(parsedUrl.data.deadline).to.be.equal(expectedDeadline)

	})


})



/*import { shallowMount, createLocalVue } from "@vue/test-utils";
import App from "@/App.vue";

import HelloWorld from "@/components/HelloWorld";

localVue.component("HelloWorld", HelloWorld);

describe("App.vue", () => {
    test("renders snap correctly if passed in true value prop", () => {
        const wrapper = shallowMount(App, {
            localVue
        });

        expect(wrapper.html()).toMatchSnapshot();
    });
});*/