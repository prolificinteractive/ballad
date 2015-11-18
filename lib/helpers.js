var path = require('path');
var _ = require('lodash');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var exec = Promise.promisify(require('child_process').exec);
var parseBlueprint = Promise.promisify(require('protagonist').parse);
var jsonModifiers = require('./jsonModifiers');
var modifierKeys = _.pluck(jsonModifiers, 'key');
var matterCompilerPath = path.resolve(__dirname, '../node_modules/matter_compiler/bin/matter_compiler');

var helpers = module.exports = {
  alphabetizeAST: function(ast, spec){
    ast.resourceGroups = _.sortBy(ast.resourceGroups, function(n){
      return n.name;
    });
    return ast;
  },
  //  Recursive function to merge 2 JSON objects together
  //  Recurses if a key contains an object.
  //  If a key exists in both objects, the value from the
  //  second object passed in will be used, if it exists.
  mergeJson: function (a, b) {
    if (!_.isObject(a)) {
      return b? b: a;
    }

    // This lets Arrays that are filled with objects be merged together.
    // This does create order dependency though, so we need to specify
    // elements in the same order as the base class
    if(_.isArray(a) && _.isArray(b)){
      if(_.every(a),_.isObject){
        return _.merge(a,b);
      } else {
        return b? b: a;
      }
    }

    var result = {};
    var keys = _.unique(_.keys(a).concat(_.keys(b)));

    // For each key in the JSON, see if it starts with '__'
    // If it does, replace the value at that key with the results of
    // merging the value at that key in the parent and child.
    _.each(keys, function (k) {
      if (/^__/.test(k)) {
        var modifier = _.indexBy(jsonModifiers, 'key')[k];

        if (modifier) {
          if (modifier.mergeArgs) {
            result[k] = modifier.mergeArgs(a[k], b[k]);
            return;
          }
        }
      }

      // Added this guard clause to prevent errors
      // caused by trying to index into object b when it doesn't exist
      if (a && b){
        result[k] = helpers.mergeJson(a[k], b[k]);
      } else if (b) {
        result[k] = b[k];
      } else {
        result[k] = a[k];
      }
    });

    return result;
  },
  blueprintToAst: function (blueprint) {
    // Use protagonist to generate an AST from a blueprint markdown file
    return parseBlueprint(blueprint)
      .get('ast')
      .tap(function (ast) {
        ast._version = '2.0';
      });
  },
  astToBlueprint: function (ast) {
    // Use the matter_compiler Ruby gem to generate a Blueprint.md file from AST
    var tmpFile = 'ast_' + Date.now() + '.tmp.json';
    var cmd = matterCompilerPath + ' ' + tmpFile + ' --format json';

    return fs
      .writeFileAsync(tmpFile, JSON.stringify(ast))
      .then(function () {
        return exec(cmd).get(0);
      })
      .then(function (blueprint) {
        return blueprint.replace(/(\{\{[a-z]+):/g, '$1');
      })
      .finally(function () {
        fs.unlinkAsync(tmpFile);
      });
  },
  mergeAst: function (child, parent) {
    if (_.isArray(child)) {
      if (_.isArray(parent)) {

        // If only child has items, return it
        if (child.length > 0 && parent.length === 0) {
          return child;
        }

        // If only parent has items, return it
        if (child.length === 0 && parent.length > 0) {
          return parent;
        }

        // If both parent and child have items, mix the arrays together based
        // on the name property of each item.
        if ((child[0] || parent[0] || {}).name) {
          var childIndex = _.indexBy(child, 'name');
          var parentIndex = _.indexBy(parent, 'name');
          return _.values(helpers.mergeAst(childIndex, parentIndex));
        }
      }

      return child;
    }

    if (_.isObject(child)) {
      if (_.isObject(parent)) {
        var result = _.mapValues(child, function (v, k) {
          return helpers.mergeAst(v, parent[k]);
        });

        return _.defaults(result, parent);
      }

      return child;
    }

    if (_.isString(child) && child.trim().length > 0) {
      return child;
    }

    return parent;
  },
  removeAstResources: function (resourceGroups, removalMap) {
    // Remove resources from the AST if they were specified as an
    // excluded endpoint in the spec. Returns the modified AST
    var result = [];
    var removalMapLowercase = {};

    _.each(removalMap, function (v, k) {
      removalMapLowercase[k.toLowerCase()] = v;
    });

    _.each(resourceGroups, function (group) {
      var resultGroup = _.extend({}, group);
      var resultResources = resultGroup.resources = [];

      result.push(resultGroup);

      _.each(group.resources, function (resource) {
        var key = (resource.uriTemplate || resource.name).toLowerCase();
        var removalMethods = removalMapLowercase[key];
        var resultResource = _.extend({}, resource);

        if (_.isArray(removalMethods)) {
          resultResource.actions = [];

          _.each(resource.actions, function (action) {
            if (removalMethods.indexOf(action.method) === -1) {
              resultResource.actions.push(action);
            }
          });

          //Omit the whole resource group if no actions leftover
          if (resultResource.actions.length > 0) {
            resultResources.push(resultResource);
          }
        } else if (removalMethods !== true) {
          resultResources.push(resultResource);
        }
      });
    });

    return result;
  }
};
