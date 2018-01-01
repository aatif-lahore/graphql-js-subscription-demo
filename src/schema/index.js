const {GraphQLObjectType, GraphQLString, GraphQLSchema} = require('graphql');
const {PubSub} = require('graphql-subscriptions');

const PubSubService   =  new PubSub();

const fakeDatabase = {
  'a': {
    id: 'a',
    name: 'alice',
  },
  'b': {
    id: 'b',
    name: 'bob',
  },
};


const userType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLString },
    name: { type: GraphQLString },
  }
});

const queries = new GraphQLObjectType({
  name: 'Query',
  fields: {
    user: {
      type: userType,
      args: {
        id: {type: GraphQLString}
      },
      resolve: function(_, {id}) {
        return fakeDatabase[id];
      }
    }
  }
});

const mutations = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    user: {
      type: userType,
      args: {
        id: {type: GraphQLString}
      },
      resolve: function(_, {id}) {
        PubSubService.publish('User', {id, name: 'Blueeast'})
        return fakeDatabase[id];
      }
    }
  }
});

const subscriptions = new GraphQLObjectType({
  name: 'Subscription',
  fields: {
    user: {
      type: userType,
      args: {
        id: {type: GraphQLString}
      },
      resolve(obj, { input }, context, info) {
        return 'You are subscribed';
      }
    }
  },
  User: {
    subscribe: () => PubSubService.asyncIterator('User'),
  }
});


const schema = new GraphQLSchema({query: queries, mutation: mutations, subscription: subscriptions});

module.exports = schema;
