const express = require("express");
const graphQlHTTP = require("express-graphql");
const { buildSchema } = require("graphql");
const { graphQlEndpoint, graphQlPort } = require("../global/const.js");
const app = express();
const initiatives = require("./initiatives.js");

const schema = buildSchema(`
  
  type Initiative {
    initiator: String,
    closed: Boolean,
    contentHash: String
  }
  
  type Query {
    initiative(id: Int!): Initiative
  }
  
`);

const root = {

	initiative: async function ({ id }) {

		const initiative = await initiatives.getInitiativeById(id);

		return {
			initiator: initiative.initiator,
			closed: initiative.closed,
			contentHash: initiative.contentHash
		};

	}

};

app.use(graphQlEndpoint, graphQlHTTP({
	schema: schema,
	rootValue: root,
	graphiql: true,
}));

app.listen(graphQlPort);
console.log(`Running a GraphQL API server at localhost:${ graphQlPort }${ graphQlEndpoint }`);
