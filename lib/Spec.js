var path = require('path');
var util = require('util');
var _ = require('lodash');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var RenderContext = require('./RenderContext');
var helpers = require('./helpers');

function Spec (options) {
  // Assigns a blank set of features if none are specified via the
  // options object. Any property not specified in the spec.json will
  // be filled in wiht the defaults listed here
  _.defaults(this, options, {
    baseDirectory: process.cwd(),
    features: [],
    excludeEndpoints: {},
    parent: options.inherit || null // Support both `parent` and `inherit` syntaxes
  });

  this._parentPromise = null;
}

Spec.load = function (baseDirectory) {
  // Loads the directory, finds the spec.json file, and parses it as JSON.
  // This JSON is then used to instantiate a new Spec object.
  return fs
    .readFileAsync(path.resolve(baseDirectory, 'spec.json'), 'utf8')
    .then(JSON.parse)
    .then(function (options) {
      var spec = new Spec(options);
      spec.baseDirectory = baseDirectory;
      return spec;
    });
};

Spec.prototype.hasParent = function () {
  return !!this.parent;
};

Spec.prototype.getParentSpec = function () {
  if (!this.hasParent()) {
    return Promise.resolve(null);
  }

  if (!this._parentPromise) {
    this._parentPromise = Spec.load(path.resolve(this.baseDirectory, this.parent));
  }

  return this._parentPromise;
};

Spec.prototype.getAst = function () {
  var _this = this;
  var fileFoundIndex = {};
  var fileTitleIndex = {};

  function recurse (spec) {

    // This function looks at the Spec.features array, and
    // tries to map all the values into .md file filenames.
    // If the files are not found, it is recorded as not having been
    // found in fileFoundIndex, and an empty string is placed in the
    // corresponding location in the returned array.

    return Promise
      .map(_this.features, function (filename) {
        var pathname = path.resolve(spec.baseDirectory, filename.replace(/\.md$/, '') + '.md');

        return fs
          .readFileAsync(pathname, 'utf-8')
          .tap(function (content) {
            fileFoundIndex[filename] = true;
            fileTitleIndex[filename] = (content.match(/# ?Group ([^\n]+)/) || [null, null])[1];
          })
          .catch(function (err) {
            if (fileFoundIndex[filename] !== true) {
              fileFoundIndex[filename] = false;
            }

            return "";
          });
      })
      .then(function (features) {
        // Converts the blueprint markdown file to an Abstract Syntax Tree
        // in JSON.
        return helpers.blueprintToAst(features.join('\n\n'));
      })
      .then(function (ast) {
        return spec
          .getParentSpec()
          .then(function (parentSpec) {
            if (!parentSpec) {
              return ast;
            }

            // If a parent Spec was found, re-run this function on that spec
            // Merge the resulting AST with the current AST using helper func
            return Promise.join(ast, recurse(parentSpec), helpers.mergeAst);
          });
      })
      .tap(function (ast) {
        // Removes resources (endpoints and models) from the AST
        // that were excluded in the spec
        ast.resourceGroups = helpers.removeAstResources(ast.resourceGroups, spec.excludeEndpoints);
      });
  }

  return recurse(this)
    .tap(function (ast) {
      // Tap each run of recurse function to check if any
      // files in the spec currently being transformed to an
      // AST were not found. Throws an error if files are missing.
      var unfoundFiles = [];

      _.each(fileFoundIndex, function (wasFound, filename) {
        if (wasFound === false) {
          unfoundFiles.push(filename);
        }
      });

      if (unfoundFiles.length > 0) {
        throw new Spec.FeaturesNotFoundError(unfoundFiles);
      }
    })
    .tap(function (ast) {
      // During AST merging, features can get out of order.
      // We need to make sure the order of the AST resource groups
      // match up with the spec.json feature array ordering.
      var groupIndex = _.indexBy(ast.resourceGroups, 'name');
      var orderedGroups = [];

      _.each(_this.features, function (filename) {
        var title = fileTitleIndex[filename];
        var group;

        if (!title) {
          return;
        }

        group = groupIndex[title];

        if (!group) {
          return;
        }

        orderedGroups.push(group);
      });

      if ( !_.isEmpty(orderedGroups)) {
        ast.resourceGroups = orderedGroups;
      }
    });
};



// This is the main public interface.
// Load up a spec from a directory using
// Spec.load, and then call the renderBlueprint
// function on it to generate a blueprint.md file.
Spec.prototype.renderBlueprint = function () {

  var _this = this;
  var ctx = this.createRenderContext();

  return this
    .getAst() // Convert spec file into a JSON AST of the API
    .then(helpers.astToBlueprint) // Convert this AST into a blueprint
    .then(ctx.renderTemplate.bind(ctx)); // Replace all placeholders with file contents
};

Spec.prototype.createRenderContext = function () {
  return new RenderContext(this);
};

Spec.FeaturesNotFoundError = function (files) {
  Error.call(this);
  this.code = 'features_not_found';
  this.message = 'Features not found: ' + files.join(', ');
};

util.inherits(Spec.FeaturesNotFoundError, Error);

module.exports = Spec;
