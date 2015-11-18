var path = require('path');
var _ = require('lodash');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var helpers = require('./helpers');
var SpecComponent = require('./SpecComponent');
var helperDirectoryMap = require('./helperDirectoryMap');
var jsonModifiers = require('./jsonModifiers');

function RenderContext (spec) {
  this.spec = spec;
  this._jsonPromises = {};
  this._gettingParentContext = null;
}

RenderContext.prototype.resolveJsonModifiers = function (obj) {
  var _this = this;

  function applyModifier (obj, modifier) {
    // Check to see if the json object contains a
    // modifier (ie: __exclude, __include, __extends).
    // If found, runs the filter, returns modified object.
    var arg = obj[modifier.key];

    if (!arg) {
      return Promise.resolve(obj);
    }

    obj = _.omit(obj, modifier.key);

    return Promise
      .resolve(modifier.filter(obj, arg, _this))
      .then(function (obj) {
        return applyModifier(obj, modifier); // If same modifier key appears after filtering
      });
  }

  function traverse (obj) {
    var promise = Promise.resolve(obj);

    // if obj is an array, just map it to the results of calling traverse
    if (_.isArray(obj)) {
      return Promise.map(obj, traverse);
    }

    if (!_.isObject(obj)) {
      return promise;
    }

    // For each possible modifier, try to apply that modifier to the object.
    _.each(jsonModifiers, function (modifier) {
      promise = promise.then(function (obj) {
        return applyModifier(obj, modifier);
      });
    });

    return promise.then(function (obj) {
      return Promise.props(_.mapValues(obj, traverse));
    });
  }

  return traverse(obj);
};

// Loading methods; asynchronous and cached
RenderContext.prototype.renderTemplate = function (template) {
  template = template
    // Replace quoted template tags (embedded within JSON)
    .replace(/"\{\{/g, '{{')
    .replace(/\}\}"/g, '}}')
    // Three brackets have special meaning in handlebars
    .replace(/\}\}\}/g, '}} }');

  return this
    .fetchTemplateDependencies(template)
    .then(function (dependencies) {
      var component = new SpecComponent({
        template: template,
        dependencies: dependencies
      });

      return component.render();
    });
};

RenderContext.prototype.getParentContext = function () {
  if (!this._gettingParentContext) {
    this._gettingParentContext = this.spec
      .getParentSpec()
      .then(function (spec) {
        return spec? spec.createRenderContext(): null;
      });
  }

  return this._gettingParentContext;
};

RenderContext.prototype.getJsonPromise = function (filename) {
  return this._jsonPromises[filename] || null;
};

RenderContext.prototype.fetchTemplateDependencies = function (template) {
  // finds all instances of {{ helper filename }} and parses the helper
  // and filename to get the full path to that file.
  // returns an object in the format:
  // {filename: json file contents }

  var _this = this;
  // Regex to find anything within a {{ }}
  var matches = template.match(/\{\{ ?[a-z]+ [^ } ?]+/g);
  var index = {};

  if (!matches) {
    return Promise.resolve(index);
  }

  return Promise
    .map(matches, function (match) {
      // Regex to strip all punctuations and braces from all found matches
      //  of previous regex
      var parts = match.replace(/[{}'"]/g, '').trim().split(' ');
      var helperName = parts[0];
      var directory = helperDirectoryMap[helperName];
      var filename = [directory, parts[1]].join(path.sep);

      if (!directory) {
        return null;
      }

      return _this
        .loadJson(filename)
        .tap(function (json) {
          if (json === null) {
            throw new Error('Object not found: ' + filename);
          }

          index[filename] = json;
        });
    })
    .then(function () {
      return _this.resolveJsonModifiers(index);
    });
};

RenderContext.prototype.loadJson = function (filename, originalContext) {
  var _this = this;
  var promise = this.getJsonPromise(filename);

  if (promise) {
    return promise;
  }

  promise = this
    .getParentContext()
    .then(function (parentContext) {
      return parentContext? parentContext.loadJson(filename, originalContext || _this): null;
    })
    .then(function (parentJson) {
      var pathname = path.resolve(_this.spec.baseDirectory, filename) + '.json';

      return fs
        .readFileAsync(pathname, 'utf8')
        .then(function (contents) {
          return (originalContext || _this).renderTemplate(contents);
        })
        .then(JSON.parse)
        .catch(tolerateFileNotFound)
        .then(function (thisJson) {
          return parentJson && thisJson?
            helpers.mergeJson(parentJson, thisJson): // If we get two JSON objects, merge them.
            parentJson || thisJson || null; // Otherwise, return any found object or null.
        });
    });

  this._jsonPromises[filename] = promise;

  return promise;
};

function tolerateFileNotFound (err) {
  if (err.code === 'ENOENT') {
    return null;
  }

  throw err;
}

module.exports = RenderContext;
