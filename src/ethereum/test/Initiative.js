const Initiatives = artifacts.require("Initiatives");

function decodeGetInitiativeById (array) {
	return {
		initiator: array[0],
		acceptance: +array[1],
		contentHash: array[2],
		executor: parseInt(array[3], 16) === 0 ? null : array[3],
		backers: array[4],
		totalFunds: +array[5],
		closed: array[6],
		voters: array[7],
		votes: array[8],
		funds: array[4].reduce((funds, backer, i) => {
			funds[backer] = +(array[9][i] || 0);
			return funds;
		}, {})
	};
}

contract('Initiatives', (accounts) => {

	const initiative1ContentHash = "abcdeabcdeabcdeabcde";
	const initiative2ContentHash = "fbcdeabcdeabcdeabcdf";
	const initiative1Acceptance = 66; // 66%, 2/3 is enough to close initiative
	const initiative2Acceptance = 30; // 30%
	const initiative1Initiator = accounts[1];
	const initiative2Initiator = accounts[2];
	const iBackers = [accounts[3], accounts[4], accounts[5]];
	const iBackerAmounts = [500000, 1000000, 100000];
	const iMans = [accounts[6], accounts[7]];
	const iExecutors = [accounts[8], accounts[9]];

	const utils = web3._extend.utils;

	let initiative = null,
		initiative1Id = null,
		initiative2Id = null,
		executorPriorBalance,
		contractBalance;

	it("Should deploy a contract normally", () => {

		return Initiatives.deployed().then((instance) => {

			initiative = instance;

			assert.notEqual(initiative, null);
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

		return initiative.create(initiative1ContentHash, initiative1Acceptance, {
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
			return initiative.getInitiativeById.call(initiative1Id);
		}).then((ini) => {
			const data = decodeGetInitiativeById(ini);
			assert.equal(data.initiator, initiative1Initiator, "Initiator should match");
			assert.equal(data.acceptance, +initiative1Acceptance, "Acceptance should be as set");
			assert.equal(
				initiative1ContentHash,
				utils.toAscii(data.contentHash),
				"Content hash should be as set"
			);
			assert.equal(data.executor, null, "Executor must be empty");
			assert.equal(data.backers.length, 0, "No backers by default");
			assert.equal(data.totalFunds, 0, "No funds by default");
			assert.equal(data.closed, false, "Not closed by default");
		});

	});

	it("Should correctly create second initiative", () => {

		return initiative.create(initiative2ContentHash, initiative2Acceptance, {
			from: initiative2Initiator
		}).then((tx) => {
			initiative2Id = +tx.logs[0].args.id;
			assert.equal(initiative2Id, 2, "Second initiative should have ID=2.");
		});

	});

	it("Should not be able to back initiative 1 with no funds", () => {

		let ex = null;

		return initiative.back(initiative1Id, {
			from: iBackers[0]
		}).catch((e) => {
			ex = e;
		}).then(() => {
			assert.notEqual(ex, null, "must throw exception");
		});

	});

	it("Should not be able to back initiative that does not exists", () => {

		let ex = null;

		return initiative.back(100500, {
			from: iBackers[0]
		}).catch((e) => {
			ex = e;
		}).then(() => {
			assert.notEqual(ex, null, "must throw exception");
		});

	});

	it("Should be able to back initiative 1", () => {

		let ex = null;

		return initiative.back(initiative1Id, {
			from: iBackers[0],
			value: iBackerAmounts[0]
		}).catch((e) => {
			ex = e;
		}).then(() => {
			assert.equal(ex, null, "must not throw exceptions");
			return initiative.getInitiativeById.call(initiative1Id);
		}).then((ini) => {
			const data = decodeGetInitiativeById(ini);
			assert.equal(data.initiator, initiative1Initiator, "Initiator should match");
			assert.equal(data.acceptance, +initiative1Acceptance, "Acceptance should be as set");
			assert.equal(
				initiative1ContentHash,
				utils.toAscii(data.contentHash),
				"Content hash should be as set"
			);
			assert.equal(data.executor, null, "Executor must still be empty");
			assert.equal(data.backers.length, 1, "Has one backer");
			assert.equal(data.backers[0], iBackers[0], "Backer is correctly set");
			assert.equal(data.closed, false, "Not closed by default");
			assert.equal(data.totalFunds, iBackerAmounts[0], "Has transferred some funds");
			return initiative.getBackerAmountByInitiativeId.call(initiative1Id, iBackers[0]);
		}).then((funds) => {
			assert.equal(+funds, iBackerAmounts[0], "Deposited correct amount");
		});

	});

	it("Should allow more backers to be able to back the initiative", () => {

		return initiative.back(initiative1Id, {
			from: iBackers[1],
			value: iBackerAmounts[1]
		}).then(() => {
			return initiative.getInitiativeById.call(initiative1Id);
		}).then(([initiator, acceptance, contentHash, executor, backers, totalFunds]) => {
			assert.equal(
				+totalFunds,
				iBackerAmounts[0] + iBackerAmounts[1],
				"First two backers must add funds successfully"
			);
		}).then(() => {
			return initiative.back(initiative1Id, {
				from: iBackers[2],
				value: iBackerAmounts[2]
			});
		}).then(() => {
			return initiative.getInitiativeById.call(initiative1Id);
		}).then((ini) => {
			const data = decodeGetInitiativeById(ini);
			assert.equal(
				data.totalFunds,
				iBackerAmounts[0] + iBackerAmounts[1] + iBackerAmounts[2],
				"All backers must add funds successfully"
			);
		});

	});

	it("Should not allow to vote just yet", () => {

		let exceptions = 0;

		return initiative.vote(100500, {
			from: iBackers[0]
		}).catch(() => {
			++exceptions;
		}).then(() => {
			return initiative.vote(initiative1Id, {
				from: iBackers[0]
			});
		}).catch(() => {
			++exceptions;
		}).then(() => {
			assert.equal(exceptions, 2, "all possible attempts to vote must not happen just yet");
		});

	});

	it("Should allow executor to mark initiative as completed", () => {

		return initiative.complete(initiative1Id, {
			from: iExecutors[0]
		}).then(() => {
			return initiative.getInitiativeById.call(initiative1Id);
		}).then((ini) => {
			const data = decodeGetInitiativeById(ini);
			assert.equal(data.initiator, initiative1Initiator, "Initiator should match");
			assert.equal(data.acceptance, +initiative1Acceptance, "Acceptance should be as set");
			assert.equal(
				initiative1ContentHash,
				utils.toAscii(data.contentHash),
				"Content hash should be as set"
			);
			assert.equal(data.executor, iExecutors[0], "Executor must be properly set");
			assert.equal(data.backers.length > 0, true, "Has some backers");
			assert.equal(data.totalFunds > 0, true, "Has some funds");
			assert.equal(data.closed, false, "Not closed by default");
			contractBalance = +web3.eth.getBalance(initiative.address);
		});

	});

	it("Should not allow random people to vote", () => {

		let exceptions = 0;

		return initiative.vote(initiative1Id, false, {
			from: iMans[0]
		}).catch(() => {
			++exceptions;
		}).then(() => {
			return initiative.vote(initiative1Id, false, {
				from: iExecutors[0]
			});
		}).catch(() => {
			++exceptions;
		}).then(() => {
			return initiative.vote(initiative1Id, true, {
				from: iMans[1]
			});
		}).catch(() => {
			++exceptions;
		}).then(() => {
			return initiative.vote(initiative1Id, false, {
				from: initiative1Initiator
			});
		}).catch(() => {
			++exceptions;
		}).then(() => {
			executorPriorBalance = +web3.eth.getBalance(iExecutors[0]);
			assert.equal(
				exceptions,
				4,
				"random people including executor nor initiator cannot vote if they don't fund"
			);
		});

	});

	it("Should allow backer to vote", () => {

		return initiative.vote(initiative1Id, true, { // positive vote
			from: iBackers[0]
		}).then(() => {
			return initiative.getInitiativeById.call(initiative1Id);
		}).then((ini) => {
			const data = decodeGetInitiativeById(ini);
			assert.equal(data.votes.length, 1, "must have 1 vote");
			assert.equal(data.voters.length, 1, "must have 1 voter");
			assert.equal(data.votes[0], true, "must have correct vote");
			assert.equal(data.voters[0], iBackers[0], "must have correct voter");
			assert.equal(data.closed, false, "must not close initiative");
			assert.equal(
				+web3.eth.getBalance(iExecutors[0]),
				executorPriorBalance,
				"must not change executor's balance"
			);
			assert.equal(
				+web3.eth.getBalance(initiative.address),
				contractBalance,
				"must not change contract's balance"
			);
		});

	});

	it("Should reward backer immediately if enough votes received", () => {

		let exceptions = 0;

		return initiative.vote(initiative1Id, true, { // positive vote
			from: iBackers[1]
		}).then(() => {
			return initiative.getInitiativeById.call(initiative1Id);
		}).then((ini) => {
			const data = decodeGetInitiativeById(ini);
			assert.equal(data.votes.length, 2, "must have 2 votes");
			assert.equal(data.voters.length, 2, "must have 2 voters");
			assert.equal(data.votes[1], true, "must have correct vote");
			assert.equal(data.voters[1], iBackers[1], "must have correct voter");
			assert.equal(
				data.closed,
				true,
				`must close initiative, as acceptance is ${ initiative1Acceptance
					}% and 2 votes is enough`
			);
			assert.equal(
				+web3.eth.getBalance(iExecutors[0]) > executorPriorBalance,
				true,
				"must increase executor's balance"
			);
			assert.equal(
				+web3.eth.getBalance(initiative.address) < contractBalance,
				true,
				"must decrease contract's balance"
			);
			assert.equal(data.executor, iExecutors[0], "must keep the executor");
		}).then(() => {
			return initiative.vote(initiative1Id, true, { // positive vote
				from: iBackers[2]
			});
		}).catch(() => {
			++exceptions;
		}).then(() => {
			assert.equal(
				exceptions,
				1,
				"must not allow last backer to vote as they decide nothing"
			);
		});

	});

});