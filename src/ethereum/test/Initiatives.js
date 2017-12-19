const Initiatives = artifacts.require("Initiatives");

contract('Initiatives', (accounts) => {

	const initiative1ContentHash = "abcdeabcdeabcdeabcde";
	const initiative2ContentHash = "fbcdeabcdeabcdeabcdf";
	const initiative1Acceptance = 70; // 70%
	const initiative2Acceptance = 30; // 30%
	const initiative1Initiator = accounts[1];
	const initiative2Initiator = accounts[2];

	const utils = web3._extend.utils;

	let contract = null,
		initiative1Id = null,
		initiative2Id = null;

	it("Should deploy a contract normally", () => {

		return Initiatives.deployed().then((instance) => {

			contract = instance;

			assert.notEqual(contract, null);
			assert.notEqual(
				+web3.eth.getBalance(accounts[0]),
				+web3.eth.getBalance(accounts[1]),
				"balances of the first two accounts should be different as fist account "
				+ "deploys the contract."
			);

		});

	});

	it("Should correctly create first initiative", () => {

		let balance = +web3.eth.getBalance(initiative1Initiator);

		return contract.createInitiative(initiative1ContentHash, initiative1Acceptance, {
			from: initiative1Initiator
		}).then((tx) => {
			initiative1Id = +tx.logs[0].args.id;
			assert.notEqual(
				balance,
				+web3.eth.getBalance(accounts[1]),
				"balance after creating initiative should change"
			);
			assert.equal(initiative1Id, 1, "First initiative should have ID=1.");
		}).then(() => {
			return contract.getInitiativeById.call(initiative1Id);
		}).then(([
			initiator, acceptance, contentHash, executor, backers, totalFunds, closed
		]) => {
			assert.equal(initiator, initiative1Initiator, "Initiator should match");
			assert.equal(acceptance, +initiative1Acceptance, "Acceptance should be as set");
			assert.equal(
				initiative1ContentHash,
				utils.toAscii(contentHash),
				"Content hash should be as set"
			);
			assert.equal(parseInt(executor, 16), 0, "Executor must be empty");
			assert.equal(backers.length, 0, "No backers by default");
			assert.equal(totalFunds, 0, "No funds by default");
			assert.equal(closed, false, "Not closed by default");
		});

	});

	it("Should correctly create second initiative", () => {

		return contract.createInitiative(initiative2ContentHash, initiative2Acceptance, {
			from: initiative2Initiator
		}).then((tx) => {
			initiative2Id = +tx.logs[0].args.id;
			assert.equal(initiative2Id, 2, "Second initiative should have ID=2.");
		});

	});

});