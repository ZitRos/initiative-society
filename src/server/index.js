const express = require("express");
const graphQlHTTP = require("express-graphql");
const { graphQlEndpoint, graphQlPort } = require("../global/const.js");
const app = express();
const schema = require("./graphQlSchema.js");
const db = require("./db.js");

const root = {

	getContent: async function ({ id }) {

		let initiative;

		try {
			initiative = await db.get(id);
		} catch (e) {
			throw e;
		}

		return initiative;

	},

	saveContent: async function ({ initiative }) {

		let ini;

		try {
			ini = await db.save(initiative);
		} catch (e) {
			throw e;
		}

		return ini;

	}

};

app.use(graphQlEndpoint, graphQlHTTP({
	schema: schema,
	rootValue: root,
	graphiql: true
}));

app.listen(graphQlPort);
console.log(`Running a GraphQL API server at localhost:${ graphQlPort }${ graphQlEndpoint }`);
