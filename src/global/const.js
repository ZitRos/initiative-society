module.exports = {
	web3ProviderHost: typeof location !== "undefined" ? location.hostname : "127.0.0.1",
	web3ProviderPort: 9545,
	graphQlEndpoint: "/graphql",
	graphQlPort: 4000
};
