var path = require('path');
var _ = require('lodash');
var Handlebars = require('handlebars');
var helperDirectoryMap = require('./helperDirectoryMap');
var HB_HELPER_INDENT = _.repeat(' ', 12);

function renderJson (obj) {
  return new Handlebars.SafeString(JSON.stringify(obj, null, 2).replace(/\n/g, '\n' + HB_HELPER_INDENT));
}

function SpecComponent (options) {
  _.defaults(this, options, {
    template: '',
    dependencies: {}
  });
}

SpecComponent.prototype.getJson = function (helper, file) {
  var filename = path.join(helperDirectoryMap[helper], file);
  var obj = this.dependencies[filename];

  if (!obj) {
    throw new Error('Object not found: ' + filename);
  }

  return obj;
};

SpecComponent.prototype.render = function () {
  return Handlebars.compile(this.template)(this);
};

SpecComponent.prototype.example = function (file) {
  var obj = this.getJson('example', file);
  return renderJson(obj);
};

SpecComponent.prototype.schema = function (file, required, description) {

  var obj = this.getJson('schema', file);

  if (typeof description === 'string') {
    obj.description = description;
  }

  // Here we set the objects 'required' property to an array to be in compliance with
  // the JSON schema 4 spec.
  obj.required = [];

  // This function handles populating the required array with a list of properties
  // which have 'required' set to true. Also removes the old 'required' with keys set
  // too booleans
  _.forEach(obj.properties, function(val, key){
    if(typeof val.required === 'boolean') {
      if(val.required === true){
        obj.required.push(key);
      }
      obj.properties[key] = _.omit(obj.properties[key],'required');
    }
  });

  // Remove any 'required' keys that are not
  // arrays to be compliant with the JSON Schema spec.
  function removeRequireBoolean (obj) {
    if(obj.required && !_.isArray(obj.required)){
      obj = _.omit(obj, 'required');
    };

    if(obj.properties) {
      _.forEach(obj.properties, removeRequireBoolean);
    }

    return obj;
  };

  obj = removeRequireBoolean(obj);


  // If the required option is set to false, we deal with it here.
  // We append the value 'null' into it's type list.
  // This means that we can accept a null value for this field, but
  // we still require the key in the structure.
  if (required === false) {
    obj.type = _.uniq([].concat(obj.type).concat('null'));
  } else {
    obj.type = [].concat(obj.type);
  }

  return renderJson(obj);
};

SpecComponent.prototype.headers = SpecComponent.prototype.header = function (file) {
  var obj = this.getJson('headers', file);
  var parts = [];

  _.each(obj, function (v, k) {
    parts.push(k + ': ' + v);
  });

  return parts.join('\n');
};

module.exports = SpecComponent;
