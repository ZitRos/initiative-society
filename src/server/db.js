const { hashInitiativeContent, a2hex } = require("../global/utils.js");
const { getInitiativeById } = require("./initiatives.js");

/**
 * Using a very trivial in-memory DB.
 */
const db = {};

const requiredProps = new Set(["id", "title", "description", "latitude", "longitude"]);

/**
 * @param {*} content - Initiative content to be saved.
 * @returns {Promise<*>}
 */
module.exports.save = async function (content = {}) {

	for (let prop of requiredProps) {
		if (!content[prop])
			throw new Error(`Required property ${ prop } is not set.`);
	}

	const hash = hashInitiativeContent(content);
	let hashInBlockchain = "";

	try {
		hashInBlockchain = (await getInitiativeById(content.id)).contentHash;
	} catch (e) {
		throw e;
	}

	if (hashInBlockchain !== hash) {
		throw new Error(
			`Unable to set content for initiative ID=${ content.id } as content hashes mismatch ${
			hashInBlockchain || "?" } != ${ hash || "?" }`
		);
	}

	db[content.id] = content; // dangerous for production: filter props

	return content;

};

/**
 * @param {number} id - Initiative ID.
 * @returns {Promise<*|null>}
 */
module.exports.get = async function (id) {

	return db[id] || null;

};