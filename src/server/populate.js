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
		initiatorAccount: 1,
		backers: [
			{ account: 2, value: 0.5 },
			{ account: 7, value: 1 },
			{ account: 3, value: 1.1 },
			{ account: 4, value: 0.3 }
		]
	}
}, {
	initiative: {
		acceptance: 50,
		title: "Repair the Old Swing",
		description: "This swing is intended for children, but it is very old.\n\nPlease help us!\n\n"
			+ "See how it looks like right now:\n\n![Broken Swing](http://ak0.picdn.net/shutterstock/videos/4730240/thumb/1.jpg)",
		latitude: 50.43080282653505,
		longitude: 30.469229221343994,
		image: "https://d35gqh05wwjv5k.cloudfront.net/media/catalog/product/cache/4/image/85e4522595efc69f496374d01ef2bf13/1477674061/s/e/see-saw-graphic-playground-sign-nd0051-lg.jpg"
	},
	populate: {
		initiatorAccount: 2,
		backers: [
			{ account: 1, value: 0.08 },
			{ account: 5, value: 0.15 },
			{ account: 8, value: 0.12 },
			{ account: 9, value: 0.3 }
		]
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
		initiatorAccount: 3,
		backers: [
			{ account: 3, value: 0.08 }
		]
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
		if (populate.backers && populate.backers.length) try {
			await Promise.all(populate.backers.map(({ account, value }) => {
				return initiatives.back(initiative.id, {
					from: accounts[account],
					value: value * 1000000000000000000, // Wei to ETH
					gas: 3000000
				});
			}));
		} catch (e) {
			console.error(`Unable to back initiative ID=${ initiative.id }`);
		}
		await db.save(initiative);
		console.log(`Populated initiative ID=${ initiative.id } (${ initiative.title })`);
	}

	console.log(`Initial data populated.`);

};