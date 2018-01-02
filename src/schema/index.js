const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLSchema,
  GraphQLInputObjectType,
  GraphQLNonNull
} = require('graphql');
// const {PubSub} = require('graphql-subscriptions');
const {LoopbackPubSub} = require('graphql-loopback-subscriptions');

const PubSubService = new LoopbackPubSub();

const fakeDatabase = {
  'a': {
    id: 'a',
    name: 'alice'
  },
  'b': {
    id: 'b',
    name: 'bob'
  }
};

const UserModel = new GraphQLObjectType({
  name: 'User',
  args: {},
  fields: () => ({
    firstName: {
      type: GraphQLString
    },
    lastName: {
      type: GraphQLString
    }
  })
});

const queries = new GraphQLObjectType({
  name: 'Query',
  fields: {
    User: {
      type: UserModel,
      args: {
        id: {type: GraphQLString}
      },
      resolve: function (_, {id}) {
        return fakeDatabase[id];
      }
    }
  }
});

const mutations = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    UserMutation: {
      type: UserModel,
      args: {
        id: {type: GraphQLString},
        lastName: {type: GraphQLString},
        firstName: {type: GraphQLString}
      },
      resolve: function (_, object) {
        PubSubService.publish('THIS-SHOULD-MATCH', object);
        return object;
      }
    }
  }
});

const UserSubscriptionInput = new GraphQLInputObjectType({
  name: 'UserSubscriptionInput',
  fields: () => ({
    create: { type: new GraphQLNonNull(GraphQLBoolean) },
    update: { type: new GraphQLNonNull(GraphQLBoolean) },
    remove: { type: new GraphQLNonNull(GraphQLBoolean) }
  })
});

const UserSubscriptionOutput = new GraphQLObjectType({
  name: `thisNameCanBeAnyName`,
  fields: () => Object.assign(
    {
      outputOfSubscription: {type: UserModel},
      clientSubscriptionId: { type: GraphQLString }
    }
  )
});

const subscriptions = new GraphQLObjectType({
  name: 'Subscription',
  fields: {
    ThisIsMyFirstSubscription: {
      type: UserSubscriptionOutput,
      args: { subscriptionInput: {type: UserSubscriptionInput}},
      resolve (dataReceived, { input }, context, info) {
        // here the object dataReceived will get data from mutation
        const op = {
          outputOfSubscription: {
            firstName: dataReceived.firstName,
            lastName: dataReceived.lastName
          },
          clientSubscriptionId: '123'
        };

        return op;
      },
      subscribe: () => PubSubService.asyncIterator('THIS-SHOULD-MATCH')
    }
  }
});

const schema = new GraphQLSchema({query: queries, mutation: mutations, subscription: subscriptions});

module.exports = schema;
