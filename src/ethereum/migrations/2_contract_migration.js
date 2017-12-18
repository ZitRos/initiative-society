const Initiatives = artifacts.require("Initiatives");

module.exports = function (deployer) {
	deployer.deploy(Initiatives);
};