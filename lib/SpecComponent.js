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
  
  // This marks that the schema is required in the API call.
  // This is different than the below required, which just lets
  // this object have a null value. 
  obj.required = true;

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
