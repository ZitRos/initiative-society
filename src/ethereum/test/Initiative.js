const Initiatives = artifacts.require("Initiatives");
const { decodeGetInitiativeById } = require("../../global/utils.js");

contract('Initiatives', (accounts) => {

	// Test is sensitive to changing these values!
	const initiative1ContentHash = "abcdeabcdeabcdeabcde";
	const initiative2ContentHash = "fbcdeabcdeabcdeabcdf";
	const initiative1Acceptance = 90; // 66%, 2/3 is enough to close initiative (1 + 2 is 93.75%)
	const initiative2Acceptance = 40; // 40%, backers 1 and 3 can't close (they're only 37.5%)
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
			return data.funds[iBackers[0]];
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
		}).then((ini) => {
			const data = decodeGetInitiativeById(ini);
			assert.equal(
				data.totalFunds,
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
			assert.equal(data.closed, false, "must not close the initiative");
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
				`must close the initiative, as acceptance is ${ initiative1Acceptance
					}% and 2 votes is enough`
			);
			assert.equal(
				+web3.eth.getBalance(iExecutors[0]) > executorPriorBalance,
				true,
				"must increase executor's balance"
			);
			assert.equal(
				+web3.eth.getBalance(initiative.address) === 0,
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

	it("Should allow more backers to vote on 2nd initiative", () => {

		return initiative.back(initiative2Id, {
			from: iBackers[0],
			value: iBackerAmounts[0]
		}).then(() => {
			return initiative.getInitiativeById.call(initiative2Id);
		}).then((ini) => {
			const data = decodeGetInitiativeById(ini);
			assert.equal(
				data.totalFunds,
				iBackerAmounts[0],
				"First backer must add funds successfully"
			);
		}).then(() => {
			return initiative.back(initiative2Id, {
				from: iBackers[1],
				value: iBackerAmounts[1]
			});
		}).then(() => {
			return initiative.getInitiativeById.call(initiative2Id);
		}).then((ini) => {
			const data = decodeGetInitiativeById(ini);
			assert.equal(
				data.totalFunds,
				iBackerAmounts[0] + iBackerAmounts[1],
				"Second backer must add funds successfully"
			);
		}).then(() => {
			return initiative.back(initiative2Id, {
				from: iBackers[2],
				value: iBackerAmounts[2]
			});
		}).then(() => {
			return initiative.getInitiativeById.call(initiative2Id);
		}).then((ini) => {
			const data = decodeGetInitiativeById(ini);
			assert.equal(
				data.totalFunds,
				iBackerAmounts[0] + iBackerAmounts[1] + iBackerAmounts[2],
				"All backers must add funds successfully"
			);
		});

	});

	it("Should allow executor to mark 2nd initiative as completed", () => {

		return initiative.complete(initiative2Id, {
			from: iExecutors[1]
		}).then(() => {
			return initiative.getInitiativeById.call(initiative2Id);
		}).then((ini) => {
			const data = decodeGetInitiativeById(ini);
			assert.equal(data.initiator, initiative2Initiator, "Initiator should match");
			assert.equal(data.acceptance, +initiative2Acceptance, "Acceptance should be as set");
			assert.equal(
				initiative2ContentHash,
				utils.toAscii(data.contentHash),
				"Content hash should be as set"
			);
			assert.equal(data.executor, iExecutors[1], "Executor must be properly set");
			assert.equal(data.backers.length > 0, true, "Has some backers");
			assert.equal(data.totalFunds > 0, true, "Has some funds");
			assert.equal(data.closed, false, "Not closed by default");
			contractBalance = +web3.eth.getBalance(initiative.address);
			executorPriorBalance = +web3.eth.getBalance(iExecutors[1]);
		});

	});

	it("Should not allow to assign executor when it is already assigned", () => {

		let exceptions = 0;

		return initiative.complete(initiative2Id, {
			from: iExecutors[0]
		}).catch(() => {
			++exceptions;
		}).then(() => {
			assert.equal(exceptions, 1, "Should not allow to reassign executor");
		});

	});

	it("Should close the initiative only if funds proportion is met", () => {

		return initiative.vote(initiative2Id, true, { // positive vote
			from: iBackers[0]
		}).then(() => {
			return initiative.vote(initiative2Id, true, { // positive vote
				from: iBackers[2]
			});
		}).then(() => {
			return initiative.getInitiativeById.call(initiative2Id);
		}).then((ini) => {
			const data = decodeGetInitiativeById(ini);
			assert.equal(data.votes.length, 2, "must have 2 votes");
			assert.equal(data.voters.length, 2, "must have 2 voters");
			assert.equal(data.votes[0], true, "must have correct vote");
			assert.equal(data.voters[0], iBackers[0], "must have correct voter");
			assert.equal(data.votes[1], true, "must have correct vote");
			assert.equal(data.voters[1], iBackers[2], "must have correct voter");
			assert.equal(
				data.closed,
				false,
				`must not close the initiative, as acceptance is ${ initiative2Acceptance
					}% and 2 votes of candidates 1 and 3 is not enough to close it`
			);
			assert.equal(
				+web3.eth.getBalance(iExecutors[1]) === executorPriorBalance,
				true,
				"must not change executor's balance"
			);
			assert.equal(
				+web3.eth.getBalance(initiative.address) === contractBalance,
				true,
				"must not change contract's balance"
			);
			assert.equal(data.executor, iExecutors[1], "must keep the executor");
		});

	});

	it("Should rollback initiative to funding state if majority of candidates vote against", () => {

		return initiative.vote(initiative2Id, false, { // negative vote
			from: iBackers[1]
		}).then(() => {
			return initiative.getInitiativeById.call(initiative2Id);
		}).then((ini) => {
			const data = decodeGetInitiativeById(ini);
			assert.equal(data.votes.length, 0, "must reset votes");
			assert.equal(data.voters.length, 0, "must reset voters");
			assert.equal(data.closed, false, `must not close the initiative`);
			assert.equal(
				data.totalFunds,
				iBackerAmounts[0] + iBackerAmounts[1] + iBackerAmounts[2],
				`must not change total funds`
			);
			assert.equal(
				+web3.eth.getBalance(iExecutors[1]) === executorPriorBalance,
				true,
				"must not change executor's balance"
			);
			assert.equal(
				+web3.eth.getBalance(initiative.address) === contractBalance,
				true,
				"must not change contract's balance"
			);
			assert.equal(data.executor, null, "must remove the executor");
		});

	});

	it("Should not allow to close the initiative after rollback if no executor is set", () => {

		let exceptions = 0;

		return initiative.vote(initiative2Id, true, { // negative vote
			from: iBackers[1]
		}).catch(() => {
			++exceptions;
		}).then(() => {
			assert.equal(exceptions, 1, "must throw exception");
		});

	});

	it("Should return id of one initiative, because this initiative is not closed", () => {

		return initiative.getOpenedInitiativesIds().then((answer) => {
			assert.equal(+answer[0], initiative2Id, "should return id of initiative2");
		});

	});

	it("Should complete initiative when new voted executor comes in", () => {

		return initiative.complete(initiative2Id, {
			from: iExecutors[0]
		}).then(() => {
			executorPriorBalance = +web3.eth.getBalance(iExecutors[0]);
			return initiative.vote(initiative2Id, true, { // positive vote of majority
				from: iBackers[1]
			});
		}).then(() => {
			return initiative.getInitiativeById.call(initiative2Id);
		}).then((ini) => {
			const data = decodeGetInitiativeById(ini);
			assert.equal(data.closed, true, `must close the initiative`);
			assert.equal(
				+web3.eth.getBalance(iExecutors[0]) > executorPriorBalance,
				true,
				"must give funds to new executor"
			);
			assert.equal(
				+web3.eth.getBalance(initiative.address) === 0,
				true,
				"must not change contract's balance"
			);
			assert.equal(data.executor, iExecutors[0], "must assign correct the executor");
		});

	});

	it("Should not return any id, because all initiatives are closed", () => {

		return initiative.getOpenedInitiativesIds().then((answer) => {
			assert.equal(+answer[0], 0, "should be equal 0");
		});

});

});