const path = require('path')
// eslint-disable-next-line no-unused-vars
const { Testkit, Utils } = require('aa-testkit')
const { Network } = Testkit({
	TESTDATA_DIR: path.join(__dirname, '../testdata'),
})

const coeff = 1.5

describe('Check AA counterstake question creation', function () {
	this.timeout(120 * 1000)

	before(async () => {
		this.network = await Network.create().run()
		this.explorer = await this.network.newObyteExplorer().ready()
		this.genesis = await this.network.getGenesisNode().ready()
		this.deployer = await this.network.newHeadlessWallet().ready()

		this.creator = await this.network.newHeadlessWallet().ready()

		await this.genesis.sendBytes({
			toAddress: await this.deployer.getAddress(),
			amount: 1e9,
		})

		const { unit, error } = await this.genesis.sendBytes({
			toAddress: await this.creator.getAddress(),
			amount: 1e9,
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit

		await this.network.witnessUntilStable(unit)
	})


	it('Deploy counterstake AA', async () => {
		const { address, unit, error } = await this.deployer.deployAgent(path.join(__dirname, '../counterstake.ojson'))

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(address).to.be.validAddress

		this.aaAddress = address

		await this.network.witnessUntilStable(unit)
	})

	it('creator sends question without deadline', async () => {
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: 1e5,
			data: {
				question: "this is a question",
			},
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit

		const { response } = await this.network.getAaResponseToUnit(unit)
		await this.network.witnessUntilStable(response.response_unit)

		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("You must specify a deadline")

	})

	it('creator forgets question', async () => {
		const paymentAmount = 1e5
		const deadline = new Date()
		deadline.setSeconds(deadline.getSeconds() +1800)
		const deadlineIso = deadline.toISOString().slice(0,-5)
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				deadline: deadlineIso
			},
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit

		const { response } = await this.network.getAaResponseToUnit(unit)
		await this.network.witnessUntilStable(response.response_unit)

		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("No question nor key nor nickname")

	})


	it('creator forgets question', async () => {
		const paymentAmount = 1e5
		const deadline = new Date()
		deadline.setSeconds(deadline.getSeconds() +1800)
		const deadlineIso = deadline.toISOString().slice(0,-5)
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				deadline: deadlineIso
			},
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit

		const { response } = await this.network.getAaResponseToUnit(unit)
		await this.network.witnessUntilStable(response.response_unit)

		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("No question nor key nor nickname")

	})

	it('creator sends short question', async () => {
		const question = "123456789"
		const paymentAmount = 1e5
		const deadline = new Date()
		deadline.setSeconds(deadline.getSeconds() +1800)
		const deadlineIso = deadline.toISOString().slice(0,-5)
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				deadline: deadlineIso,
				question: question
			},
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		const { response } = await this.network.getAaResponseToUnit(unit)
		await this.network.witnessUntilStable(response.response_unit)
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("Question must be over 10 chars")

	})

	it('creator sends long question', async () => {
		var question = ""
		for (var i=0; i<=256;i++)
			question+="a"
		const paymentAmount = 1e5
		const deadline = new Date()
		deadline.setSeconds(deadline.getSeconds() +1800)
		const deadlineIso = deadline.toISOString().slice(0,-5)
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				deadline: deadlineIso,
				question: question
			},
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		const { response } = await this.network.getAaResponseToUnit(unit)
		await this.network.witnessUntilStable(response.response_unit)
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("Question cannot be over 128 chars")

	})


	it('creator sends deadline with milliseconds', async () => {
		const question = "this is a question"
		const paymentAmount = 1e5
		const deadline = new Date()
		deadline.setSeconds(deadline.getSeconds() +1800)
		const deadlineIso = deadline.toISOString()
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				deadline: deadlineIso,
				question: question
			},
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		const { response } = await this.network.getAaResponseToUnit(unit)
		await this.network.witnessUntilStable(response.response_unit)
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("Deadline is not a valid ISO string")

	})

	it('creator sends too early deadline', async () => {
		const question = "this is a question"
		const paymentAmount = 1e5
		const deadline = new Date()
		deadline.setSeconds(deadline.getSeconds() +300)
		const deadlineIso = deadline.toISOString().slice(0,-5)
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				deadline: deadlineIso,
				question: question
			},
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		const { response } = await this.network.getAaResponseToUnit(unit)
		await this.network.witnessUntilStable(response.response_unit)
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("Deadline must be at least 900 seconds from now")

	})

	it('creator sends wrong initial_coeff', async () => {
		const question = "this is a question"
		const paymentAmount = 1e5
		const deadline = new Date()
		deadline.setSeconds(deadline.getSeconds() + 15000)
		const deadlineIso = deadline.toISOString().slice(0,-5)
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				deadline: deadlineIso,
				question: question,
				initial_coeff: 'lalala'
			},
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		const { response } = await this.network.getAaResponseToUnit(unit)
		await this.network.witnessUntilStable(response.response_unit)
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("initial_coeff must be a number")

	})

	it('creator sends too low initial_coeff', async () => {
		const question = "this is a question"
		const paymentAmount = 1e5
		const deadline = new Date()
		deadline.setSeconds(deadline.getSeconds() + 15000)
		const deadlineIso = deadline.toISOString().slice(0,-5)
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				deadline: deadlineIso,
				question: question,
				initial_coeff: 0.999999
			},
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		const { response } = await this.network.getAaResponseToUnit(unit)
		await this.network.witnessUntilStable(response.response_unit)
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("initial_coeff must be >= 1")

	})

	it('creator sends wrong counterstake_coeff', async () => {
		const question = "this is a question"
		const paymentAmount = 1e5
		const deadline = new Date()
		deadline.setSeconds(deadline.getSeconds() + 15000)
		const deadlineIso = deadline.toISOString().slice(0,-5)
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				deadline: deadlineIso,
				question: question,
				counterstake_coeff: 'lalala'
			},
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		const { response } = await this.network.getAaResponseToUnit(unit)
		await this.network.witnessUntilStable(response.response_unit)
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("counterstake_coeff must be a number")

	})

	it('creator sends too low initial_coeff', async () => {
		const question = "this is a question"
		const paymentAmount = 1e5
		const deadline = new Date()
		deadline.setSeconds(deadline.getSeconds() + 15000)
		const deadlineIso = deadline.toISOString().slice(0,-5)
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				deadline: deadlineIso,
				question: question,
				counterstake_coeff: 0.999999
			},
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		const { response } = await this.network.getAaResponseToUnit(unit)
		await this.network.witnessUntilStable(response.response_unit)
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("counterstake_coeff must be >= 1")

	})


	it('creator sends question', async () => {
		const question = "this is a question"
		const paymentAmount = 1e5
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

		await this.network.witnessUntilStable(response.response_unit)
		var creatorAddress= await this.creator.getAddress()
		expect(response.bounced).to.be.false

		const question_id = response.response.responseVars.question_id
		expect(question_id).to.be.a('string');
		expect(response.response.responseVars.new_question).to.be.equal(question);
		const { vars } = await this.deployer.readAAStateVars(this.aaAddress)

		expect(vars[question_id]).to.be.equal('created');
		expect(vars[question_id+"_question"]).to.be.equal(question);
		expect(vars[question_id+"_deadline"]).to.be.equal(Math.floor(deadline.getTime()/1000));
		expect(vars[question_id+"_reward"]).to.be.equal(paymentAmount);

	})

	it('creator sends question with additional description', async () => {
		const question = "this is a question"
		const description = "with additional description"
		const paymentAmount = 1e5
		const deadline = new Date()
		deadline.setSeconds(deadline.getSeconds() +1800)
		const deadlineIso = deadline.toISOString().slice(0,-5)
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				question: question,
				deadline: deadlineIso,
				description: description
			},
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit

		const { response } = await this.network.getAaResponseToUnit(unit)

		await this.network.witnessUntilStable(response.response_unit)
		var creatorAddress= await this.creator.getAddress()
		expect(response.bounced).to.be.false

		const question_id = response.response.responseVars.question_id
		expect(question_id).to.be.a('string');
		expect(response.response.responseVars.new_question).to.be.equal(question);
		const { vars } = await this.deployer.readAAStateVars(this.aaAddress)

		expect(vars[question_id]).to.be.equal('created');
		expect(vars[question_id+"_question"]).to.be.equal(question);
		expect(vars[question_id+"_description"]).to.be.equal(description);
		expect(vars[question_id+"_deadline"]).to.be.equal(Math.floor(deadline.getTime()/1000));
		expect(vars[question_id+"_reward"]).to.be.equal(paymentAmount);

	})


	it('creator sends additional description too long', async () => {
		const question = "this is a question"
		var description = ""
		for (var i=0; i<=256;i++)
			description+="a"
		const paymentAmount = 1e5
		const deadline = new Date()
		deadline.setSeconds(deadline.getSeconds() +1800)
		const deadlineIso = deadline.toISOString().slice(0,-5)
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				question: question,
				deadline: deadlineIso,
				description: description
			},
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		const { response } = await this.network.getAaResponseToUnit(unit)
		await this.network.witnessUntilStable(response.response_unit)
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("Additional description cannot be over 256 chars")

	})


	it('creator sends question with custom initial coeff', async () => {
		const question = "this is another question"
		const description = "with additional description"
		const paymentAmount = 1e5
		const initial_coeff = 5
		const deadline = new Date()
		deadline.setSeconds(deadline.getSeconds() +1800)
		const deadlineIso = deadline.toISOString().slice(0,-5)
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				question: question,
				deadline: deadlineIso,
				description: description,
				initial_coeff: initial_coeff
			},
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit

		const { response } = await this.network.getAaResponseToUnit(unit)

		await this.network.witnessUntilStable(response.response_unit)
		var creatorAddress= await this.creator.getAddress()
		expect(response.bounced).to.be.false

		const question_id = response.response.responseVars.question_id
		expect(question_id).to.be.a('string');
		expect(response.response.responseVars.new_question).to.be.equal(question);
		const { vars } = await this.deployer.readAAStateVars(this.aaAddress)

		expect(vars[question_id]).to.be.equal('created');
		expect(vars[question_id+"_question"]).to.be.equal(question);
		expect(vars[question_id+"_initial_coeff"]).to.be.equal(initial_coeff);
		expect(vars[question_id+"_description"]).to.be.equal(description);
		expect(vars[question_id+"_deadline"]).to.be.equal(Math.floor(deadline.getTime()/1000));
		expect(vars[question_id+"_reward"]).to.be.equal(paymentAmount);

	})

	it('creator sends question with custom counterstake coeff', async () => {
		const question = "this is another question 2"
		const description = "with additional description"
		const paymentAmount = 1e5
		const counterstake_coeff = 1.7
		const deadline = new Date()
		deadline.setSeconds(deadline.getSeconds() +1800)
		const deadlineIso = deadline.toISOString().slice(0,-5)
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				question: question,
				deadline: deadlineIso,
				description: description,
				counterstake_coeff: counterstake_coeff
			},
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit

		const { response } = await this.network.getAaResponseToUnit(unit)

		await this.network.witnessUntilStable(response.response_unit)
		expect(response.bounced).to.be.false

		const question_id = response.response.responseVars.question_id
		expect(question_id).to.be.a('string');
		expect(response.response.responseVars.new_question).to.be.equal(question);
		const { vars } = await this.deployer.readAAStateVars(this.aaAddress)

		expect(vars[question_id]).to.be.equal('created');
		expect(vars[question_id+"_question"]).to.be.equal(question);
		expect(vars[question_id+"_counterstake_coeff"]).to.be.equal(counterstake_coeff);
		expect(vars[question_id+"_description"]).to.be.equal(description);
		expect(vars[question_id+"_deadline"]).to.be.equal(Math.floor(deadline.getTime()/1000));
		expect(vars[question_id+"_reward"]).to.be.equal(paymentAmount);

	})

	it('creator sends question with default coeffs', async () => {
		const question = "this is another question 3"
		const description = "with additional description"
		const paymentAmount = 1e5
		const initial_coeff = 5
		const deadline = new Date()
		deadline.setSeconds(deadline.getSeconds() +1800)
		const deadlineIso = deadline.toISOString().slice(0,-5)
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.aaAddress,
			amount: paymentAmount,
			data: {
				question: question,
				deadline: deadlineIso,
				description: description,
				initial_coeff: coeff,
				counterstake_coeff: coeff,

			},
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit

		const { response } = await this.network.getAaResponseToUnit(unit)

		await this.network.witnessUntilStable(response.response_unit)
		var creatorAddress= await this.creator.getAddress()
		expect(response.bounced).to.be.false

		const question_id = response.response.responseVars.question_id
		expect(question_id).to.be.a('string');
		expect(response.response.responseVars.new_question).to.be.equal(question);
		const { vars } = await this.deployer.readAAStateVars(this.aaAddress)

		expect(vars[question_id]).to.be.equal('created');
		expect(vars[question_id+"_question"]).to.be.equal(question);
		expect(vars[question_id+"_initial_coeff"]).to.be.undefined
		expect(vars[question_id+"_counterstake_coeff"]).to.be.undefined
		expect(vars[question_id+"_description"]).to.be.equal(description);
		expect(vars[question_id+"_deadline"]).to.be.equal(Math.floor(deadline.getTime()/1000));
		expect(vars[question_id+"_reward"]).to.be.equal(paymentAmount);

	})


	it('creator sends duplicated question', async () => {
		const question = "this is a question"
		const paymentAmount = 1e5
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
		await this.network.witnessUntilStable(response.response_unit)
		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("This question already exists")
	})


	after(async () => {
		// uncomment this line to pause test execution to get time for Obyte DAG explorer inspection
		// await Utils.sleep(3600 * 1000)
		await this.network.stop()
	})
})
