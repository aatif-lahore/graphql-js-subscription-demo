const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLSchema,
  GraphQLInputObjectType,
  GraphQLNonNull
} = require('graphql')
const {PubSub} = require('graphql-subscriptions')

const PubSubService = new PubSub()

const fakeDatabase = {
  'a': {
    id: 'a',
    name: 'alice'
  },
  'b': {
    id: 'b',
    name: 'bob'
  }
}

const UserModel = new GraphQLObjectType({
  name: 'User',
  args: {},
  fields: () => ({
    input: {
      type: UserModel
    }
  })
})

const UserInput = new GraphQLInputObjectType({
  name: 'UserInput',
  fields: () => ({
    username: { type: new GraphQLNonNull(GraphQLString) },
    age: { type: new GraphQLNonNull(GraphQLString) },
    gender: { type: new GraphQLNonNull(GraphQLString) }
  })
})

const UserSubscriptionInput = new GraphQLInputObjectType({
  name: 'UserSubscriptionInput',
  fields: () => ({
    create: { type: new GraphQLNonNull(GraphQLBoolean) },
    update: { type: new GraphQLNonNull(GraphQLBoolean) },
    remove: { type: new GraphQLNonNull(GraphQLBoolean) }
  })
})

const queries = new GraphQLObjectType({
  name: 'Query',
  fields: {
    User: {
      type: UserModel,
      args: {
        id: {type: GraphQLString}
      },
      resolve: function (_, {id}) {
        return fakeDatabase[id]
      }
    }
  }
})

const mutations = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    User: {
      type: UserModel,
      args: {
        id: {type: GraphQLString}
      },
      resolve: function (_, {id}) {
        PubSubService.publish('User', {id, name: 'Blueeast'})
        return fakeDatabase[id]
      }
    }
  }
})

const outputType = new GraphQLObjectType({
  name: `UserSubscriptionOutput`,
  fields: () => Object.assign(
    {},
    { User: { type: UserModel } },
    { clientSubscriptionId: { type: GraphQLString } }
  )
})

const subscriptions = new GraphQLObjectType({
  name: 'Subscription',
  fields: {
    User: {
      type: outputType,
      args: {
        input: { type: UserSubscriptionInput }
      },
      resolve (obj, { input }, context, info) {
        return obj
      },
      subscribe: () => PubSubService.asyncIterator('User')
    }
  }
})

const schema = new GraphQLSchema({query: queries, mutation: mutations, subscription: subscriptions})

module.exports = schema
