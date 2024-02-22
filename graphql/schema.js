const { buildSchema } = require("graphql");

module.exports = buildSchema(`
  type Query {
    hello: TestData
  }

  type TestData {
    text: String!
    views: Int!
  }
`);
