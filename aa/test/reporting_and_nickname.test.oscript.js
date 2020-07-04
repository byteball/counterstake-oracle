const path = require('path')
// eslint-disable-next-line no-unused-vars
const { Testkit, Utils } = require('aa-testkit')
const { Network } = Testkit({
	TESTDATA_DIR: path.join(__dirname, '../testdata'),
})


const overpayment_fee = 1000;
const challenge_period_length = 3*24*3600;
const coeff = 1.5

const rewardAmount_1= 1e6
const rewardAmount_2= 5e6
var question_id_1 = null;
var question_id_2 = null;
describe('Check AA counterstake reporting', function () {
	this.timeout(120 * 1000)

	before(async () => {
		this.network = await Network.create().run()
		this.explorer = await this.network.newObyteExplorer().ready()
		this.genesis = await this.network.getGenesisNode().ready()
		this.deployer = await this.network.newHeadlessWallet().ready()

		this.creator = await this.network.newHeadlessWallet().ready()
		this.reporter_1 = await this.network.newHeadlessWallet().ready()
		this.reporter_2 = await this.network.newHeadlessWallet().ready()
		this.reporter_3 = await this.network.newHeadlessWallet().ready()

		await this.genesis.sendBytes({
			toAddress: await this.deployer.getAddress(),
			amount: 1e9,
		})
		await this.genesis.sendBytes({
			toAddress: await this.reporter_1.getAddress(),
			amount: 1e9,
		})
		await this.genesis.sendBytes({
			toAddress: await this.reporter_2.getAddress(),
			amount: 1e9,
		})
		await this.genesis.sendBytes({
			toAddress: await this.reporter_3.getAddress(),
			amount: 1e9,
		})

		const { unit, error } =  await this.genesis.sendBytes({
			toAddress: await this.creator.getAddress(),
			amount: 1e9,
		})

		await this.network.witnessUntilStable(unit)
		expect(error).to.be.null
		expect(unit).to.be.validUnit
	})

	it('Deploy counterstake AA', async () => {
		const { address, unit, error } = await this.deployer.deployAgent(path.join(__dirname, '../counterstake.ojson'))

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(address).to.be.validAddress

		this.aaAddress = address

		await this.network.witnessUntilStable(unit)
	})

	it('creator sends question 1', async () => {
		const question = "this is question 1"
		const paymentAmount = rewardAmount_1
		const deadline = new Date()
		deadline.setSeconds(deadline.getSeconds() +1800)
		const deadlineIso = deadline.toISOString().slice(0,-5)
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				question: question,
				deadline: deadlineIso
			},
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit

		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(response.bounced).to.be.false
		question_id_1 = response.response.responseVars.question_id
	})

	it('creator sends question 2', async () => {
		const question = "this is question 2"
		const paymentAmount = rewardAmount_2
		const deadline = new Date()
		deadline.setSeconds(deadline.getSeconds() + 1800)
		const deadlineIso = deadline.toISOString().slice(0,-5)
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				question: question,
				deadline: deadlineIso,
				counterstake_coeff: coeff,
				initial_coeff: coeff
			},
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit

		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(response.bounced).to.be.false
		question_id_2 = response.response.responseVars.question_id
	})

	it('report too early question 1', async () => {
		const paymentAmount = rewardAmount_1 * coeff
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				question_id: question_id_1,
				outcome :"yes"
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.bounced).to.be.true

		expect(response.response.error).to.be.equal("Deadline isn't reached, cannot be graded yet")

	})


	const q1_initial_stake_by_rpt1 = rewardAmount_1 * coeff
	it('report question 1', async () => {
		await this.network.timetravel({ shift: '40m' })

		const paymentAmount = q1_initial_stake_by_rpt1;
		const { unit, error } = await this.reporter_1.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				question_id: question_id_1,
				outcome :"yes"
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.bounced).to.be.false

		expect(response.response.responseVars.expected_reward).to.be.equal(rewardAmount_1)
		expect(response.response.responseVars.total_staked_on_yes).to.be.equal(q1_initial_stake_by_rpt1)
		expect(response.response.responseVars.total_staked_on_no).to.be.equal(false)
		expect(response.response.responseVars.question_id).to.be.equal(question_id_1)
		expect(response.response.responseVars.reported_outcome).to.be.equal("yes")
		expect(response.response.responseVars.resulting_outcome).to.be.equal("yes")

		const { vars } = await this.deployer.readAAStateVars(this.aaAddress)
		expect(vars[question_id_1]).to.be.equal("being_graded");
		expect(vars[question_id_1 + "_initial_reporter"]).to.be.equal(await this.reporter_1.getAddress());
		expect(vars[question_id_1 + "_outcome"]).to.be.equal("yes");
		expect(vars[question_id_1 + "_total_staked_on_yes"]).to.be.equal((q1_initial_stake_by_rpt1));
		expect(vars[question_id_1 + "_total_staked_on_yes_by_" + (await this.reporter_1.getAddress())]).to.be.equal((q1_initial_stake_by_rpt1));
		expect(vars[question_id_1 + "_total_staked"]).to.be.equal((q1_initial_stake_by_rpt1));

	})



	it('report question 2 incorrect outcome', async () => {

		const paymentAmount = rewardAmount_2 * coeff
		const { unit, error } = await this.reporter_1.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				question_id: question_id_2,
				outcome :"bad"
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("Outcome must be yes or no")

	})

	it('report question 2 low amount', async () => {

		const paymentAmount = rewardAmount_2 * coeff-1;
		const { unit, error } = await this.reporter_1.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				question_id: question_id_2,
				outcome :"yes"
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("You must stake at least "+rewardAmount_2 * coeff+" bytes to grade this question")
		
	})

	const q2_initial_stake_by_rpt1 = rewardAmount_2 * coeff
	it('report question 2', async () => {
		const { unit, error } = await this.reporter_1.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: q2_initial_stake_by_rpt1,
			data: {
				question_id: question_id_2,
				outcome :"yes"
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.bounced).to.be.false

		expect(response.response.responseVars.expected_reward).to.be.equal(rewardAmount_2)
		expect(response.response.responseVars.total_staked_on_yes).to.be.equal(q2_initial_stake_by_rpt1)
		expect(response.response.responseVars.total_staked_on_no).to.be.false
		expect(response.response.responseVars.question_id).to.be.equal(question_id_2)
		expect(response.response.responseVars.reported_outcome).to.be.equal("yes")
		expect(response.response.responseVars.resulting_outcome).to.be.equal("yes")

		await this.network.witnessUntilStable(response.response_unit)
		const { vars } = await this.deployer.readAAStateVars(this.aaAddress)
		expect(vars[question_id_2]).to.be.equal("being_graded");
		expect(vars[question_id_2 + "_outcome"]).to.be.equal("yes");
		expect(vars[question_id_2 + "_total_staked_on_no"]).to.be.undefined
		expect(vars[question_id_2 + "_total_staked_on_yes"]).to.be.equal((q2_initial_stake_by_rpt1));
		expect(vars[question_id_2 + "_initial_reporter"]).to.be.equal(await this.reporter_1.getAddress());

		expect(vars[question_id_2 + "_total_staked_on_yes_by_" + (await this.reporter_1.getAddress())]).to.be.equal((q2_initial_stake_by_rpt1));
		expect(vars[question_id_2 + "_total_staked"]).to.be.equal((q2_initial_stake_by_rpt1));
	})

	const q2_counterstake_1_by_rpt2 = q2_initial_stake_by_rpt1 * coeff
	it('question 2 counterstake 1 by reporter 2', async () => {
		const { unit, error } = await this.reporter_2.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: q2_counterstake_1_by_rpt2,
			data: {
				question_id: question_id_2,
				outcome :"no"
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.bounced).to.be.false

		expect(response.response.responseVars.total_staked_on_yes).to.be.equal(q2_initial_stake_by_rpt1)
		expect(response.response.responseVars.total_staked_on_no).to.be.equal(q2_counterstake_1_by_rpt2)
		expect(response.response.responseVars.question_id).to.be.equal(question_id_2)
		expect(response.response.responseVars.reported_outcome).to.be.equal("no")
		expect(response.response.responseVars.resulting_outcome).to.be.equal("no")

		await this.network.witnessUntilStable(response.response_unit)
		const { vars } = await this.deployer.readAAStateVars(this.aaAddress)
		expect(vars[question_id_2]).to.be.equal("being_graded");
		expect(vars[question_id_2 + "_outcome"]).to.be.equal("no");
		expect(vars[question_id_2 + "_total_staked_on_no"]).to.be.equal((q2_counterstake_1_by_rpt2));
		expect(vars[question_id_2 + "_total_staked_on_yes"]).to.be.equal((q2_initial_stake_by_rpt1));
		expect(vars[question_id_2 + "_initial_reporter"]).to.be.equal(await this.reporter_1.getAddress());

		expect(vars[question_id_2 + "_total_staked_on_no_by_" + (await this.reporter_2.getAddress())]).to.be.equal((q2_counterstake_1_by_rpt2));
		expect(vars[question_id_2 + "_total_staked"]).to.be.equal((q2_counterstake_1_by_rpt2 + q2_initial_stake_by_rpt1));
	})


	const q2_counterstake_2_by_rpt1 = q2_counterstake_1_by_rpt2 * coeff - q2_initial_stake_by_rpt1
	it('question 2 counterstake 2 by reporter 1', async () => {
		const { unit, error } = await this.reporter_1.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: q2_counterstake_2_by_rpt1,
			data: {
				question_id: question_id_2,
				outcome :"yes"
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.bounced).to.be.false

		expect(response.response.responseVars.total_staked_on_yes).to.be.equal(q2_initial_stake_by_rpt1 + q2_counterstake_2_by_rpt1)
		expect(response.response.responseVars.total_staked_on_no).to.be.equal(q2_counterstake_1_by_rpt2)
		expect(response.response.responseVars.question_id).to.be.equal(question_id_2)
		expect(response.response.responseVars.reported_outcome).to.be.equal("yes")
		expect(response.response.responseVars.resulting_outcome).to.be.equal("yes")

		await this.network.witnessUntilStable(response.response_unit)
		const { vars } = await this.deployer.readAAStateVars(this.aaAddress)
		expect(vars[question_id_2]).to.be.equal("being_graded");
		expect(vars[question_id_2 + "_outcome"]).to.be.equal("yes");
		expect(vars[question_id_2 + "_total_staked_on_no"]).to.be.equal((q2_counterstake_1_by_rpt2));
		expect(vars[question_id_2 + "_total_staked_on_yes"]).to.be.equal((q2_initial_stake_by_rpt1 + q2_counterstake_2_by_rpt1));
		expect(vars[question_id_2 + "_initial_reporter"]).to.be.equal(await this.reporter_1.getAddress());

		expect(vars[question_id_2 + "_total_staked_on_yes_by_" + (await this.reporter_1.getAddress())]).to.be.equal((q2_initial_stake_by_rpt1 + q2_counterstake_2_by_rpt1));
		expect(vars[question_id_2 + "_total_staked"]).to.be.equal((q2_counterstake_1_by_rpt2 + q2_initial_stake_by_rpt1 + q2_counterstake_2_by_rpt1));
	})


	it('counterstake question 1 same outcome', async () => {

		const paymentAmount = rewardAmount_1 * coeff * coeff
		const { unit, error } = await this.reporter_1.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				question_id: question_id_1,
				outcome :"yes"
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("Question is already graded with this outcome")

	})
	
	
	const q1_counterstake_1_by_rpt2 = q1_initial_stake_by_rpt1 * coeff;
	it('counterstake 1 question 1', async () => {
		const { unit, error } = await this.reporter_2.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: q1_counterstake_1_by_rpt2,
			data: {
				question_id: question_id_1,
				outcome :"no"
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit

		expect(response.response.responseVars.total_staked_on_yes).to.be.equal(q1_initial_stake_by_rpt1)
		expect(response.response.responseVars.total_staked_on_no).to.be.equal(q1_counterstake_1_by_rpt2)
		expect(response.response.responseVars.question_id).to.be.equal(question_id_1)
		expect(response.response.responseVars.reported_outcome).to.be.equal("no")
		expect(response.response.responseVars.resulting_outcome).to.be.equal("no")

		await this.network.witnessUntilStable(response.response_unit)
		const { vars } = await this.deployer.readAAStateVars(this.aaAddress)
		expect(vars[question_id_1]).to.be.equal("being_graded");
		expect(vars[question_id_1 + "_outcome"]).to.be.equal("no");
		expect(vars[question_id_1 + "_total_staked_on_yes"]).to.be.equal((q1_initial_stake_by_rpt1));
		expect(vars[question_id_1 + "_total_staked_on_no"]).to.be.equal((q1_counterstake_1_by_rpt2));

		expect(vars[question_id_1 + "_total_staked_on_no_by_" + (await this.reporter_2.getAddress())]).to.be.equal((q1_counterstake_1_by_rpt2));
		expect(vars[question_id_1 + "_total_staked"]).to.be.equal((q1_initial_stake_by_rpt1 + q1_counterstake_1_by_rpt2));

	})

	const q1_counterstake_2_by_rpt1 = q1_counterstake_1_by_rpt2 * coeff - q1_initial_stake_by_rpt1
	it('counterstake 2 question 1 over payment', async () => {
		const overpayment = 98524
		const paymentAmount = q1_counterstake_2_by_rpt1 + overpayment
		const { unit, error } = await this.reporter_1.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				question_id: question_id_1,
				outcome :"yes"
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		const reporter_1_addr = await this.reporter_1.getAddress()
		expect(response.response.responseVars.total_staked_on_yes).to.be.equal(q1_initial_stake_by_rpt1 + q1_counterstake_2_by_rpt1)
		expect(response.response.responseVars.total_staked_on_no).to.be.equal(q1_counterstake_1_by_rpt2)
		expect(response.response.responseVars.question_id).to.be.equal(question_id_1)
		expect(response.response.responseVars.reported_outcome).to.be.equal("yes")
		expect(response.response.responseVars.resulting_outcome).to.be.equal("yes")

		await this.network.witnessUntilStable(response.response_unit)
		const { unitObj: refundUnit, error: refundError } = await this.deployer.getUnitInfo({ unit: response.response_unit })
		expect(refundError).to.be.null

		expect(Utils.hasOnlyTheseExternalPayments(refundUnit, [{
			address: reporter_1_addr,
			amount: overpayment - overpayment_fee
		}])).to.be.true

	})

	const q1_partial_counterstake_3_by_rpt3 = 100000
	it('partial counterstake 3 question 1', async () => {
		const { unit, error } = await this.reporter_3.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: q1_partial_counterstake_3_by_rpt3,
			data: {
				question_id: question_id_1,
				outcome :"no"
			},
		})

		const { response } = await this.network.getAaResponseToUnit(unit)
		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.response.responseVars.total_staked_on_yes).to.be.equal(q1_initial_stake_by_rpt1 + q1_counterstake_2_by_rpt1)
		expect(response.response.responseVars.total_staked_on_no).to.be.equal(q1_counterstake_1_by_rpt2 + q1_partial_counterstake_3_by_rpt3)
		expect(response.response.responseVars.question_id).to.be.equal(question_id_1)
		expect(response.response.responseVars.reported_outcome).to.be.equal("no")
		expect(response.response.responseVars.resulting_outcome).to.be.equal("yes")
		expect(response.response_unit).to.be.null

	})

	const q1_complete_counterstake_3_by_rpt2 = (q1_initial_stake_by_rpt1 + q1_counterstake_2_by_rpt1) * coeff - q1_counterstake_1_by_rpt2
	it('completion counterstake 3 question 1', async () => {
		const { unit, error } = await this.reporter_2.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: q1_complete_counterstake_3_by_rpt2,
			data: {
				question_id: question_id_1,
				outcome :"no"
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		const reporter_2_addr = await this.reporter_2.getAddress()
		expect(response.response.responseVars.total_staked_on_yes).to.be.equal(q1_initial_stake_by_rpt1 + q1_counterstake_2_by_rpt1)
		expect(response.response.responseVars.total_staked_on_no).to.be.equal(q1_counterstake_1_by_rpt2 + q1_complete_counterstake_3_by_rpt2 )
		expect(response.response.responseVars.question_id).to.be.equal(question_id_1)
		expect(response.response.responseVars.reported_outcome).to.be.equal("no")
		expect(response.response.responseVars.resulting_outcome).to.be.equal("no")

		await this.network.witnessUntilStable(response.response_unit)
	
		const { unitObj: refundUnit, error: refundError } = await this.deployer.getUnitInfo({ unit: response.response_unit })
		expect(refundError).to.be.null

		expect(Utils.hasOnlyTheseExternalPayments(refundUnit, [{
			address: reporter_2_addr,
			amount: q1_partial_counterstake_3_by_rpt3 - overpayment_fee
		}])).to.be.true

	})


	it('commit too early question 1', async () => {
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: 10000,
			data: {
				question_id: question_id_1,
				commit : 1
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("challenge period is still running")

	})


	it('nickname too short', async () => {
		const { unit, error } = await this.reporter_2.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: 10000,
			data: {
				nickname: "12"
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("Nickname must be over at least 3 chars")

	})

	it('nickname too long', async () => {
		var nickname =""
		for (var i=0; i<=50;i++)
		nickname+="a"
		const { unit, error } = await this.reporter_2.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: 10000,
			data: {
				nickname: nickname
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("Nickname can't be over 50 chars")

	})


	it('reporter 2 sets new nickname', async () => {
		const { unit, error } = await this.reporter_2.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: 10000,
			data: {
				nickname: "reporter2"
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)
		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.response.responseVars.nickname).to.be.equal("reporter2")
		expect(response.response.responseVars.message).to.be.equal("Nickname changed for reporter2")

		await this.network.witnessUntilStable(response.response_unit)
		const { vars } = await this.deployer.readAAStateVars(this.aaAddress)
		expect(vars['nickname_' + await this.reporter_2.getAddress()]).to.be.equal('reporter2');
	})

	it('reporter 1 sets new nickname', async () => {
		const { unit, error } = await this.reporter_1.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: 10000,
			data: {
				nickname: "reporter1"
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)
		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.response.responseVars.nickname).to.be.equal("reporter1")
		expect(response.response.responseVars.message).to.be.equal("Nickname changed for reporter1")

		await this.network.witnessUntilStable(response.response_unit)
		const { vars } = await this.deployer.readAAStateVars(this.aaAddress)
		expect(vars['nickname_' + await this.reporter_1.getAddress()]).to.be.equal('reporter1');
	})


	it('reporter 2 sets new nickname', async () => {
		const { unit, error } = await this.reporter_2.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: 10000,
			data: {
				nickname: "reporter2bis"
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)
		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.response.responseVars.nickname).to.be.equal("reporter2bis")
		expect(response.response.responseVars.message).to.be.equal("Nickname changed for reporter2bis")

		await this.network.witnessUntilStable(response.response_unit)
		const { vars } = await this.deployer.readAAStateVars(this.aaAddress)
		expect(vars['nickname_' + await this.reporter_2.getAddress()]).to.be.equal('reporter2bis');
		expect(vars['nickname_' + await this.reporter_1.getAddress()]).to.be.equal('reporter1');
	})


	it('nickname overpayment', async () => {
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: 10001,
			data: {
				nickname: "overpayer"
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)
		await this.network.witnessUntilStable(response.response_unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("payment amount over 10000 bytes")

	})

	it('withdraw too early question 1', async () => {
		const { unit, error } = await this.reporter_2.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: 10000,
			data: {
				question_id: question_id_1,
				withdraw : 1
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("not committed yet")

	})

	it('commit overpayment', async () => {
		const shift = (challenge_period_length+ 1000) + 's'
		await this.network.timetravel({ shift: shift})
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: 10001,
			data: {
				question_id: question_id_1,
				commit : 1
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)
		await this.network.witnessUntilStable(response.response_unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("payment amount over 10000 bytes")

	})

	it('counterstake challenge period expired', async () => {

		const paymentAmount = rewardAmount_1 * coeff * coeff
		const { unit, error } = await this.reporter_1.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				question_id: question_id_1,
				outcome :"yes"
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("challenging period expired")

	})

	it('commit question 2', async () => {
		const { unit, error } = await this.reporter_3.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: 10000,
			data: {
				question_id: question_id_2,
				commit : 1
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)
		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.response.responseVars.committed_outcome).to.be.equal('yes')

		await this.network.witnessUntilStable(response.response_unit)
		const { vars } = await this.deployer.readAAStateVars(this.aaAddress)

		const address_reporter_1 = await this.reporter_1.getAddress()

		expect(vars[question_id_2]).to.be.equal('committed');
		expect(vars[question_id_2 + '_total_staked_on_yes_by_' + address_reporter_1]).to.be.undefined;

		const total_winning_stake = q2_initial_stake_by_rpt1 + q2_counterstake_2_by_rpt1
		const payout_reporter_1 = total_winning_stake + q2_counterstake_1_by_rpt2 + rewardAmount_2

		expect(response.response.responseVars.paid_out_amount).to.be.equal(payout_reporter_1)
		expect(response.response.responseVars.question_id).to.be.equal(question_id_2)
		expect(response.response.responseVars.paid_out_address).to.be.equal(address_reporter_1)

		await this.network.witnessUntilStable(response.response_unit)

		const { unitObj: payoutUnit, error: payoutError } = await this.deployer.getUnitInfo({ unit: response.response_unit })
		expect(payoutError).to.be.null

		expect(Utils.hasOnlyTheseExternalPayments(payoutUnit, [{
			address: address_reporter_1,
			amount: payout_reporter_1
		}])).to.be.true

		const payload = payoutUnit.messages.find(m => m.app === 'data_feed')
		expect(payload.payload[question_id_2]).to.be.equal('yes')

	})

	it('commit question 1', async () => {
		const { unit, error } = await this.reporter_3.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: 10000,
			data: {
				question_id: question_id_1,
				commit : 1
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit

		expect(response.response.responseVars.paid_out_amount).to.be.undefined
		expect(response.response.responseVars.paid_out_address).to.be.undefined
		expect(response.response.responseVars.question_id).to.be.equal(question_id_1)
		expect(response.response.responseVars.committed_outcome).to.be.equal('no')

		await this.network.witnessUntilStable(response.response_unit)
		const { vars } = await this.deployer.readAAStateVars(this.aaAddress)

		expect(vars[question_id_1]).to.be.equal('committed');

		const { unitObj: datafeedUnit, error: datafeedError } = await this.deployer.getUnitInfo({ unit: response.response_unit })
		expect(datafeedError).to.be.null
		const payload = datafeedUnit.messages.find(m => m.app === 'data_feed')
		expect(payload.payload[question_id_1]).to.be.equal('no')

	})

	it('withdraw overpayment', async () => {
		const { unit, error } = await this.reporter_2.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: 10001,
			data: {
				question_id: question_id_1,
				withdraw : 1
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("payment amount over 10000 bytes")

	})

	it('withdraw by loser', async () => {
		const { unit, error } = await this.reporter_1.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: 10000,
			data: {
				question_id: question_id_1,
				withdraw : 1
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("you didn't stake on the winning outcome or you already withdrew")

	})


	it('reporter 2 withdraws ', async () => {
		const address_reporter_2 =  await this.reporter_2.getAddress();
		const { unit, error } = await this.reporter_1.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: 10000,
			data: {
				question_id: question_id_1,
				withdraw : 1,
				address: address_reporter_2
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit

		const total_winning_stake = q1_counterstake_1_by_rpt2 + q1_complete_counterstake_3_by_rpt2;
		const reporter_2_share = q1_counterstake_1_by_rpt2 + q1_complete_counterstake_3_by_rpt2 - q1_partial_counterstake_3_by_rpt3; 
		const total_prize = total_winning_stake + q1_initial_stake_by_rpt1 + q1_counterstake_2_by_rpt1 + rewardAmount_1;
		const payout_reporter_2 = Math.round(total_prize * reporter_2_share / total_winning_stake);

		expect(response.response.responseVars.paid_out_amount).to.be.equal(payout_reporter_2)
		expect(response.response.responseVars.question_id).to.be.equal(question_id_1)
		expect(response.response.responseVars.message).to.be.equal("paid " + payout_reporter_2 + " bytes")
		expect(response.response.responseVars.paid_out_address).to.be.equal(address_reporter_2)

		await this.network.witnessUntilStable(response.response_unit)
		const { vars } = await this.deployer.readAAStateVars(this.aaAddress)

		expect(vars[question_id_1 + '_total_staked_on_no_by_' + address_reporter_2]).to.be.undefined;
		expect(vars[question_id_1 + '_total_staked_on_no_by_' + (await this.reporter_3.getAddress())]).to.be.equal(q1_partial_counterstake_3_by_rpt3);

		const { unitObj: payoutUnit, error: payoutError } = await this.deployer.getUnitInfo({ unit: response.response_unit })
		expect(payoutError).to.be.null

		expect(Utils.hasOnlyTheseExternalPayments(payoutUnit, [{
			address: address_reporter_2,
			amount: payout_reporter_2
		}])).to.be.true

	})

	it('reporter 2 tries withdraw again ', async () => {
		const { unit, error } = await this.reporter_2.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: 10000,
			data: {
				question_id: question_id_1,
				withdraw : 1
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("you didn't stake on the winning outcome or you already withdrew")

	})

	it('reporter 3 withdraws ', async () => {
		const address_reporter_3 =  await this.reporter_3.getAddress();
		const { unit, error } = await this.reporter_3.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: 10000,
			data: {
				question_id: question_id_1,
				withdraw : 1
			},
		})
		const { response } = await this.network.getAaResponseToUnit(unit)

		expect(error).to.be.null
		expect(unit).to.be.validUnit

		const total_winning_stake = q1_counterstake_1_by_rpt2 + q1_complete_counterstake_3_by_rpt2;
		const total_prize = total_winning_stake + q1_initial_stake_by_rpt1 + q1_counterstake_2_by_rpt1 + rewardAmount_1;
		const payout_reporter_3 = Math.round(total_prize * q1_partial_counterstake_3_by_rpt3 / total_winning_stake);

		expect(response.response.responseVars.paid_out_amount).to.be.equal(payout_reporter_3)
		expect(response.response.responseVars.question_id).to.be.equal(question_id_1)
		expect(response.response.responseVars.message).to.be.equal("paid " + payout_reporter_3 + " bytes")
		expect(response.response.responseVars.paid_out_address).to.be.equal(address_reporter_3)

		await this.network.witnessUntilStable(response.response_unit)
		const { vars } = await this.deployer.readAAStateVars(this.aaAddress)

		expect(vars[question_id_1 + '_total_staked_on_no_by_' + address_reporter_3]).to.be.undefined;

		const { unitObj: payoutUnit, error: payoutError } = await this.deployer.getUnitInfo({ unit: response.response_unit })
		expect(payoutError).to.be.null

		expect(Utils.hasOnlyTheseExternalPayments(payoutUnit, [{
			address: address_reporter_3,
			amount: payout_reporter_3
		}])).to.be.true

	})


	after(async () => {
		// uncomment this line to pause test execution to get time for Obyte DAG explorer inspection
		//await Utils.sleep(3600 * 1000)
		await this.network.stop()
	})
})
