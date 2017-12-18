const Initiative = artifacts.require("Initiative");

module.exports = function (deployer) {
	deployer.deploy(Initiative);
};