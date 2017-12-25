const { buildSchema } = require("graphql");

module.exports = buildSchema(`
  
  input InitiativeInput {
    id: Int!,
    title: String!,
    description: String!,
    latitude: Float!,
    longitude: Float!,
    image: String,
    cover: String,
    link: String
  }
  
  type Initiative {
    id: Int!,
    title: String!,
    description: String!,
    latitude: Float!,
    longitude: Float!,
    image: String,
    cover: String,
    link: String
  }
  
  type Query {
    getContent(id: Int!): Initiative
  }
  
  type Mutation {
    saveContent(initiative: InitiativeInput!): Initiative
  }
  
`);