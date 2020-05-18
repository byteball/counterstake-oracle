import { shallowMount, createLocalVue } from '@vue/test-utils'
import QuestionModalCardReportOutcome from '../src/components/QuestionModalCardReportOutcome.vue'
import Buefy from 'buefy'

const localVue = createLocalVue()

localVue.use(Buefy)

describe('QuestionModalCardReportOutcome', () => {

	const wrapper = shallowMount(QuestionModalCardReportOutcome, {
		mocks: {
			$t: m => m
		},
		localVue,
		propsData: {
			question:{
				question: "Must we have evidence to know the truth?",
				question_id: "k_5LHwVEkVHsA7A6n/",
				reward: 10000000
			}
		}
	})


  it('is reporting visible', () => {
		const divCreate = wrapper.find({ ref: 'div-report' })
		expect(divCreate.exists()).to.be.true
		const divLink = wrapper.find({ ref: 'div-link' })
		expect(divLink.exists()).to.be.false
	})
	
	it('is button create not visible', () => {
		const buttonCreate = wrapper.find({ ref: 'button-create' })
		expect(buttonCreate.exists()).to.be.false
	})

	it('are buttons correctly labelled', async() => {
		const buttonYes = wrapper.find({ ref: 'button-yes' })
		expect(buttonYes.text()).to.be.string('Yes')
		const buttonNo = wrapper.find({ ref: 'button-no' })
		expect(buttonNo.text()).to.be.string('No')

	})

	
  it('is selectedOutcome properly set', async() => {
		const buttonYes = wrapper.find({ ref: 'button-yes' })
		buttonYes.vm.$emit('click')
		await localVue.nextTick()
		expect(wrapper.vm.selectedOutcome).to.be.string('yes')
	})

	it('is button create visible', () => {
		const buttonCreate = wrapper.find({ ref: 'button-create' })
		expect(buttonCreate.exists()).to.be.true
	})

	it('is selectedOutcome properly set2', async() => {
		const buttonNo = wrapper.find({ ref: 'button-no' })
		buttonNo.vm.$emit('click')
		await localVue.nextTick()
		expect(wrapper.vm.selectedOutcome).to.be.string('no')
	})

	it('is link visible after clicking ok', async() => {
		const buttonCreate = wrapper.find({ ref: 'button-create' })
		buttonCreate.trigger('click')
		await localVue.nextTick()
		const divCreate = wrapper.find({ ref: 'div-report' })
		expect(divCreate.exists()).to.be.false
		const divLink = wrapper.find({ ref: 'div-link' })
		expect(divLink.exists()).to.be.true
	})



})

