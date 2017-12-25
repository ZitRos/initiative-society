const sha1 = require("sha1");

module.exports = {

	decodeGetInitiativeById: (array) => ({
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
	}),

	hashInitiative: (initiative = {}) => sha1(
		  "-" + sha1(initiative.id || "")
		+ "-" + sha1(initiative.title || "")
		+ "-" + sha1(initiative.description || "")
		+ "-" + sha1(initiative.latitude || "")
		+ "-" + sha1(initiative.longitude || "")
		+ "-" + sha1(initiative.image || "")
		+ "-" + sha1(initiative.cover || "")
		+ "-" + sha1(initiative.link || "")
	)

};