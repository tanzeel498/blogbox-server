module.exports = `
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
    imageUrl: String!
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

  type PostsData {
    posts: [Post!]!
    totalPosts: Int!
  }

  type Mutation {
    createUser(userInput: UserInputData): User!
    createPost(postInput: PostInputData): Post!
    updatePost(id: ID!, postInput: PostInputData): Post!
    deletePost(id: ID!): Boolean
    updateStatus(status: String!): User!
  }
  
  type Query {
    hello(name: String): String!
    login(email: String!, password: String!): AuthData!
    posts(page: Int): PostsData!
    post(id: ID!): Post!
    user: User!
  }
`;
