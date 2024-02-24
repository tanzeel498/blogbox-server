const { buildSchema } = require("graphql");

module.exports = buildSchema(`
  input UserInputData {
    email: String!
    name: String!
    password: String!
  }

  input PostInputData {
    content: String!
    title: String!
    imageUrl: String!
  }

  type Post {
    _id: ID!
    title: String!
    content: String!
    creator: User!
    createdAt: String!
    updatedAt: String!
  }

  type User {
    _id: ID!
    name: String!
    password: String
    email: String!
    status: String!
    posts: [Post!]!
  }

  type AuthData {
    token: String!
    userId: ID!
  }

  type Mutation {
    createUser(userInput: UserInputData): User!
    createPost(postInput: PostInputData): Post!
  }
  
  type Query {
    hello(name: String): String!
    login(email: String!, password: String!): AuthData!
  }
`);
