const InitiativesContract = require("../ethereum/build/contracts/Initiatives.json");
const Web3 = require("../client/node_modules/web3");
const { web3ProviderPort } = require("../global/const.js");
const truffleContract = require("../client/node_modules/truffle-contract");
const serverUrl = `http://127.0.0.1:${ web3ProviderPort }`;
const provider = new Web3.providers.HttpProvider(serverUrl);
const contract = truffleContract(InitiativesContract);
const { decodeGetInitiativeById } = require("../global/utils.js");

contract.setProvider(provider.currentProvider || provider);

// dirty hack for web3@1.0.0 support for localhost testrpc,
// see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof contract.currentProvider.sendAsync !== "function") {
	contract.currentProvider.sendAsync = function() {
		return contract.currentProvider.send.apply(
			contract.currentProvider, arguments
		);
	};
}

let initiatives = null;

async function ready () {

	if (initiatives)
		return initiatives;

	try {
		initiatives = await contract.deployed();
	} catch (e) {
		console.error(`Contract was not deployed to the network or ${ serverUrl } is down`, e);
	}

	return initiatives;

}

module.exports.getInitiativeById = async function getInitiative (id) {

	if (!await ready())
		return null;

	try {
		return decodeGetInitiativeById(await initiatives.getInitiativeById(id));
	} catch (e) {
		console.error(e);
		return null;
	}

};

module.exports.ready = ready;