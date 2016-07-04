var path = require('path');
var should = require('should');
var _ = require('lodash');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var pcf = require('../index');
var Spec = pcf.Spec;
var helpers = require('../lib/helpers');

function testForEndpoints (spec, expected) {
  return spec.getAst().tap(function (ast) {
    var endpointNames = [];

    _.each(ast.resourceGroups, function (group) {
      _.each(group.resources, function (resource) {
        _.each(resource.actions, function (action) {
          endpointNames.push(action.name);
        });
      });
    });

    endpointNames.join(', ').should.equal(expected.join(', '));
  });
}

describe('Helpers', function () {
  describe('mergeJson', function () {
    it('should merge 2 objects, giving child values precedence', function () {
      var obj1 = {
        prop1: "green"
      };

      var obj2 = {
        prop1: "red"
      };

      var merged = helpers.mergeJson(obj1, obj2);
      return merged.prop1.should.equal('red');

    });

    it("should not try to merge nested json modifiers if the parent has them but the child doesn't", function () {
      var childObject = {
        name: 'name'
      };
      var parentObject = {
        name: 'new name',
        address: {
          '__include': ['address1'],
          address1: 'address line number 1',
          address2: 'address line number 2'
        }
      };
      var expectedResult = {
        name: 'name',
        address: {
          '__include': ['address1'],
          address1: 'address line number 1',
          address2: 'address line number 2'
        }
      };

      var merged = helpers.mergeJson(parentObject, childObject);

      merged.should.deepEqual(expectedResult);
    });
  });
});


describe('Spec', function () {
  describe('inherit from parent spec', function () {
    // There is a city schema in both the parent and child,
    // However the schema that refers to it, is only in the parent.
    // The desired behavior is for the parent spec to still check if
    // the child has a city schema, and merge them, no matter what.
    it('should inherit from parent spec if the resource is not in the child', function () {
      return Spec
        .load('./test/fixtures/childSpec')
        .call('renderBlueprint')
        .tap(function(blueprint){
          blueprint.indexOf('parentInherited').should.not.equal(-1);
        });
    });

    it('should keep the same order of features as in the spec.json file', function () {
      return Spec
        .load('./test/fixtures/childSpec')
        .call('renderBlueprint')
        .then(helpers.blueprintToAst)
        .tap(function (ast) {
          var names = _.pluck(ast.resourceGroups, 'name');
          var namesInCorrectOrder = ['Doodads', 'Sprockets', 'Widgets', 'Gizmos', 'Reviews'];

          names.join('\n').should.equal(namesInCorrectOrder.join('\n'));
        });
    });

    it('should check the child spec for any overridden files', function () {
      return Spec
        .load('./test/fixtures/childNestedSpec')
        .call('renderBlueprint')
        .tap(function (blueprint) {
          blueprint.indexOf('Road Runner').should.not.equal(-1);
        });
    });

    it('should override resources in the parent that are specified in the child', function () {
      // In this test a property of widget is going to be changed in the child spec.
      // This should override the setting in the parent.
      return Spec
        .load('./test/fixtures/childSpec')
        .call('renderBlueprint')
        .tap(function (blueprint) {
          blueprint.indexOf('parentOverridden').should.not.equal(-1);
        });
    });

  });

  describe('loading spec.json', function () {
    describe('features', function () {
      it('appends the markdown contents from each file named in the array into the blueprint', function () {
        var spec = new Spec({
          baseDirectory: path.resolve(__dirname, 'fixtures/parentSpec'),
          features: [
            'overview',
            'endpoints/products',
            'endpoints/reviews'
          ]
        });

        return testForEndpoints(spec, [
          'Remove Product',
          'Update Product',
          'Get Product Reviews',
          'Submit Product Review'
        ]);
      });
    });

    describe('excludeEndpoints object', function () {
      describe('when value is true', function () {
        it('should remove all action for that endpoint', function () {
          var spec = new Spec({
            baseDirectory: path.resolve(__dirname, 'fixtures/parentSpec'),
            features: [
              'overview',
              'endpoints/products',
              'endpoints/reviews'
            ],
            excludeEndpoints: {
              '/products/{id}/reviews': true
            }
          });

          return testForEndpoints(spec, [
            'Remove Product',
            'Update Product'
          ]);
        });
      });

      describe('when value is an array of methods', function () {
        it('should only remove specified methods', function () {
          var spec = new Spec({
            baseDirectory: path.resolve(__dirname, 'fixtures/parentSpec'),
            features: [
              'overview',
              'endpoints/products',
              'endpoints/reviews'
            ],
            excludeEndpoints: {
              '/products/{id}/reviews': ['POST']
            }
          });

          return testForEndpoints(spec, [
            'Remove Product',
            'Update Product',
            'Get Product Reviews'
          ]);
        });
      });

      describe('when a blueprint is generated', function () {
        it('should remove the endpoints specified', function () {
          return Spec.load('./test/fixtures/parentSpec')
          .then(function(spec){
            spec.excludeEndpoints = {
              "/products/{id}/reviews": ["GET"]
            };
            return spec.renderBlueprint();
          })
          .tap(function(blueprint) {
            blueprint.indexOf('Returns all product reviews.').should.equal(-1);
            blueprint.indexOf('Submits a product review for a product.').should.not.equal(-1);
          });
        });

        it('should remove all endpoints if set to true', function () {
          return Spec.load('./test/fixtures/parentSpec')
          .then(function(spec){
            spec.excludeEndpoints = {
              "/products/{id}/reviews": true
            };
            return spec.renderBlueprint();
          })
          .tap(function(blueprint) {
            blueprint.indexOf('Returns all product reviews.').should.equal(-1);
            blueprint.indexOf('Submits a product review for a product.').should.equal(-1);
          });
        });
      });

      describe('when the endpoint to be excluded is in the child', function() {
        it('should properly generate the endpoints in the AST', function () {
          var spec = new Spec({
            baseDirectory: path.resolve(__dirname, 'fixtures/childSpec'),
            inherit: "../parentSpec",
            features: [
              'overview',
              'endpoints/products',
              'endpoints/reviews'
            ],
            excludeEndpoints: {
              '/products/{id}/reviews': true
            }
          });

          return testForEndpoints(spec, [
            'Get Products',
            'Add Product',
            'Save Product',
            'Remove Product',
            'Update Product'
          ]);
        });


        it('should remove the endpoints specified', function () {
          return Spec.load('./test/fixtures/childSpec')
          .then(function(spec){
            spec.excludeEndpoints = {
              "/products/{id}/reviews": ["GET"]
            };
            return spec.renderBlueprint();
          })
          .tap(function(blueprint) {
            blueprint.indexOf('Returns all product reviews.').should.equal(-1);
            blueprint.indexOf('Submits a product review for a product.').should.not.equal(-1);
          });
        });

        it('should remove all endpoints if set to true', function () {
          return Spec.load('./test/fixtures/childSpec')
          .then(function(spec){
            spec.excludeEndpoints = {
              "/products/{id}/reviews": true
            };
            return spec.renderBlueprint();
          })
          .tap(function(blueprint) {
            blueprint.indexOf('Returns all product reviews.').should.equal(-1);
            blueprint.indexOf('Submits a product review for a product.').should.equal(-1);
          });
        });
      });
    });
  });

  describe('Handlebars helpers', function () {
    describe('{{example "exampleName"}}', function () {
      it('should pull `exampleName.json` from examples directory', function () {
        var spec = new Spec({
          baseDirectory: path.resolve(__dirname, 'fixtures', 'parentSpec')
        });

        var fileLoaded = fs.readFileAsync(path.resolve(spec.baseDirectory, 'examples', 'shortProduct.json'), 'utf8');

        return spec.createRenderContext()
          .renderTemplate('{{example "shortProduct"}}')
          .then(function (rendered) {
            return fileLoaded.tap(function (fileContents) {
              rendered = JSON.stringify(JSON.parse(rendered)); // Normalize whitespace
              fileContents = JSON.stringify(JSON.parse(fileContents));
              rendered.should.equal(fileContents);
            });
          });
      });
    });

    describe('{{header "headerName"}}', function () {
      it('should pull `headerName.json` from headers directory and format it as a `key: value` list', function () {
        var spec = new Spec({
          baseDirectory: path.resolve(__dirname, 'fixtures', 'parentSpec')
        });

        return spec.createRenderContext()
          .renderTemplate('{{headers "session"}}')
          .tap(function (rendered) {
            /^sessionId: [0-9a-z]+$/.test(rendered.trim()).should.equal(true);
          });
      });
    });

    describe('{{schema "schemaName"}}', function () {
      it('should work when referencing a schema only in the parent', function () {
        return Spec
          .load('./test/fixtures/aliasTestingSpec')
          .call('renderBlueprint')
          .tap(function(blueprint) {
            blueprint.indexOf('SKEW').should.not.equal(-1);
          });
      });


      describe('overriding required property from template', function () {
        it('should add null to the object\'s type array when required is set to false', function () {

          var spec = new Spec({
            baseDirectory: path.resolve(__dirname, 'fixtures', 'requireTestingSpec'),
            parent: '../parentSpec'
          });

          var fileLoaded = fs.readFileAsync(path.resolve(spec.baseDirectory, 'schemas', 'requireTest.json'), 'utf8');

          return spec.createRenderContext()
            .renderTemplate('{{ schema "requireTest"}}')
            .then(function (rendered) {
              templateJson = JSON.parse(rendered);
              templateJson.a_required_field.type.should.eql(['string']);
              templateJson.another_required_field.type.should.eql(['string']);
              templateJson.an_optional_field.type.should.eql(['string', 'null']);
            });
        });
      });

      describe('overriding description property from template', function () {
        it('should override an object description if manually specified in the helper', function () {
          return Spec.load('./test/fixtures/descriptionSpec')
            .call('renderBlueprint')
            .tap(function(blueprint){
              blueprint.indexOf('This is a description specified in a helper').should.not.equal(-1);
            });
        });
      });
    });
  });

  describe('JSON component files', function () {
    describe('merging with parent files', function () {
      describe('overriding properties', function () {

      });

      describe('Examples', function(){
        it('merge properly when a key is false', function(){
          var exampleTestingSpec = Spec.load('./test/fixtures/exampleTestingSpec').call('renderBlueprint');
          return exampleTestingSpec.then(function(blueprint){
            blueprint.indexOf('"otherPrintsAvailable": false').should.not.equal(-1);
          });
        });

        it('properly display arrays', function(){
          var exampleTestingSpec = Spec.load('./test/fixtures/exampleTestingSpec').call('renderBlueprint');
          return exampleTestingSpec.then(function(blueprint){
            blueprint.indexOf('"parentItems": [').should.not.equal(-1);
          });
        });
      });
    });

    describe('__exclude', function () {
      var testSpec = Spec.load('./test/fixtures/childSpec').call('renderBlueprint');

      it('removes specified key from object', function () {
        return testSpec.then(function(blueprint){
          blueprint.indexOf('manufacture').should.equal(-1);
        });
      });

      it('removes the key only from specific object', function () {
        return testSpec.then(function(blueprint){
          /SKEW/.test(blueprint).should.equal(true);
          /SSN/.test(blueprint).should.equal(true);
        });
      });

      it('works when given an array of keys to exclude', function () {
        return testSpec.then(function(blueprint){
          blueprint.indexOf('temperature').should.equal(-1);
          blueprint.indexOf('thickness').should.equal(-1);
          blueprint.indexOf('pressure').should.equal(-1);
        });
      });

      it('correctly excludes from a parent that has been extended', function () {
        var extendExcludeSpec = Spec.load('./test/fixtures/extendExcludeTest').call('renderBlueprint');
        return extendExcludeSpec.then(function(blueprint){
          blueprint.indexOf('parentProp1').should.equal(-1);
          blueprint.indexOf('parentProp2').should.equal(-1);
          blueprint.indexOf('parentProp3').should.equal(-1);
        });
      });

      it('correctly excludes when there are nested levels of excludes', function () {
        var extendExcludeSpec = Spec.load('./test/fixtures/extendExcludeTest2').call('renderBlueprint');
        return extendExcludeSpec.then(function(blueprint){
          blueprint.indexOf('parentProp1').should.equal(-1);
          blueprint.indexOf('parentProp2').should.equal(-1);
          blueprint.indexOf('parentProp3').should.equal(-1);
          blueprint.indexOf('parentProp5').should.equal(-1);
          blueprint.indexOf('parentProp6').should.equal(-1);
          blueprint.indexOf('parentProp4').should.not.equal(-1);
        });
      });
    });

    describe('__extends', function () {
      it("adds to the extended file when not inheriting", function () {
        return Spec.load('./test/fixtures/orphanSpec')
          .then(function(spec){
            return spec.renderBlueprint();
          })
          .then(function(blueprint){
            blueprint.indexOf('testAttr').should.not.equal(-1);
          });
      });

      it("adds to the extended file when inheriting, if the extended file is with the parent", function () {
        return Spec.load('./test/fixtures/childSpec')
          .then(function(spec){
            return spec.renderBlueprint();
          })
          .then(function(blueprint){
            blueprint.indexOf('parentExtended').should.not.equal(-1);
          });
      });
    });

    describe('resolving dependencies', function () {
      it('should replace handlebars tags', function () {
        var renderContext = new pcf.RenderContext({
          spec: new pcf.Spec({})
        });

        renderContext._jsonPromises = {
          'schemas/test': Promise.resolve({ foo: 'bar' })
        };

        return renderContext
          .renderTemplate('{"test":"{{schema \"test\"}}"}')
          .then(JSON.parse)
          .tap(function(result) {
            result.test.foo.should.equal('bar');
        });
      });
    });
  });

  describe('error states', function () {
    describe('missing features', function () {
      it('should return the missing file name', function () {
        return Spec
          .load(path.resolve(__dirname, 'fixtures/badSpec'))
          .tap(function(spec) {
            spec.features = ['endpoints/fakeEndpoint'];
          })
          .call('renderBlueprint')
          .tap(function(result) {
            throw new Error('error not thrown for non-existent feature');
          })
          .catch(pcf.Spec.FeaturesNotFoundError, _.noop); // Test passes with this kind of error
      });
    });
  });
});
