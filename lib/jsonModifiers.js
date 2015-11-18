var _ = require('lodash');

// Defined as an array to ensure order
module.exports = [
  {
    key: '__extends',
    filter: function (obj, arg, ctx) {
      return ctx
        .loadJson(arg)
        .then(function (json) {
          return _.merge({}, json, obj, function(a,b,key){
            // Helper for the merge function, fixes a bug with __exclude not working properly
            // when there are multiple levels of it.
            if ( key === "__exclude" && (_.isArray(a) || _.isArray(b) )){
              return [].concat(a || []).concat(b || []);
            }
          });
        });
    },
    mergeArgs: function (a, b) {
      return b || a;
    }
  },
  {
    key: '__include',
    filter: _.pick,
    mergeArgs: function (a, b) {
      return [].concat(a || []).concat(b || []);
    }
  },
  {
    key: '__exclude',
    filter: _.omit,
    mergeArgs: function (a, b) {
      return [].concat(a || []).concat(b || []);
    }
  }
];
