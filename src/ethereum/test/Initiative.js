const Initiative = artifacts.require("Initiative");

contract('Initiative', (accounts) => {

	it("Should deploy a contract normally", () => {

		return Initiative.deployed().then((instance) => {

			assert.notEqual(
				+web3.eth.getBalance(accounts[0]),
				+web3.eth.getBalance(accounts[1]),
				"Balances of the first two accounts should be different as fist account "
				+ "deploys the contract."
			);

		});

	});

});