/**
 * This script populates initial data if it is not detected in the Blockchain.
 * This script is for testing purposes only.
 */
const initiatives = require("./initiatives.js");
const db = require("./db.js");
const { hashInitiativeContent, hex2a } = require("../global/utils.js");

const dataToPopulate = [{
	initiative: {
		// id property will be inserted here later
		acceptance: 80,
		title: "Plant a Lot of Flowers",
		description: "We need to plant a lot of flowers here!",
		latitude: 50.45475807277256,
		longitude: 30.52728295326233,
		image: "https://www.bridalguide.com/sites/default/files/slideshow-images/gerbera-brights-teleflora_9.jpg"
	},
	populate: {
		initiatorAccount: 1
	}
}, {
	initiative: {
		acceptance: 50,
		title: "Repair the Old Swing",
		description: "This swing is intended for children, but it is very old.\n\nPlease help us!\n\n"
			+ "See how it looks like right now: ![Broken Swing](http://www.boxturtlebulletin.com/btb/wp-content/uploads/2011/06/broken-swing-set.jpg)",
		latitude: 50.43080282653505,
		longitude: 30.469229221343994,
		image: "https://d35gqh05wwjv5k.cloudfront.net/media/catalog/product/cache/4/image/85e4522595efc69f496374d01ef2bf13/1477674061/s/e/see-saw-graphic-playground-sign-nd0051-lg.jpg"
	},
	populate: {
		initiatorAccount: 2
	}
}, {
	initiative: {
		acceptance: 30,
		title: "Help the Street Guitarist to Buy a New Guitar",
		description: "This man plays there each night, and he plays on a broken guitar...\n\n"
			+ "People, let's buy a new guitar for him as a gift!",
		latitude: 50.488722837426586,
		longitude: 30.49729585647583,
		image: "http://youtubemusicsucks.com/wp-content/uploads/2017/09/broken-acoustic-guitar.jpg"
	},
	populate: {
		initiatorAccount: 3
	}
}];

module.exports = async function populate () {

	const firstInitiative = await initiatives.getInitiativeById(1);

	if (!firstInitiative || firstInitiative.initiator) {
		console.log(`Network already has some data, aborting initial data population.`);
		return;
	}

	console.log(`Network has no data, populating some test data...`);

	const accounts = await initiatives.getAccounts();

	for (const { initiative, populate } of dataToPopulate) {
		const hash = hashInitiativeContent(initiative);
		initiative.id = await initiatives.create(hex2a(hash), initiative.acceptance, {
			from: accounts[populate.initiatorAccount || 0],
			gas: 3000000
		});
		await db.save(initiative);
		console.log(`Populated initiative ID=${ initiative.id } (${ initiative.title })`);
	}

	console.log(`Initial data populated.`);

};