![Ballad](ballad.jpg)

Assemble API Blueprint specifications with concatenation, templating, and inheritance.

Ballad is designed to write API documentation quickly and easily, using composition and
keeping things [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself).

Each component of your specifications should be written with the [API Blueprint](https://apiblueprint.org/)
format. [Check out how to write Blueprints here](https://docs.apiary.io/api_101/api_blueprint_tutorial/).

Ballad was built with the [spoke-hub distribution paradigm](https://en.wikipedia.org/wiki/Spoke%E2%80%93hub_distribution_paradigm)
in mind, meaning it easily allows the creation of API specifications derived from a base one, in an object-oriented manner.

# Table of Contents
  1. [Installation](#installation)
  2. [Setting Up a Spec](#setting-up-a-spec)
  3. [JSON Helpers](./json-helpers.md)
  4. [Usage Examples](./examples.md)
  5. [Best Practices](./best_practice.md)

## Installation

Node.js and NPM are required. You must install node version 0.12 prior to running the install command:

```bash
$ npm install -g ballad
```

### build command

```bash
$ ballad build path/to/specs path/to/output.md
```

Loads `spec.json` at the root of `path/to/specs`, and generates a blueprint version of the spec.

### docs command

```bash
$ ballad docs path/to/specs path/to/output.html
```

Loads `spec.json` at the root of the folder, and generates an HTML version of the spec.

## Setting Up a Spec

First we'll lay out a basic example, then explain the purpose of each directory and file.

```
spec/
  spec.json
  package.json
  Makefile
  overview.md
  node_modules/
  endpoints/
    products.md
  examples/
    product.json
  schemas/
    product.json
  models/
    product.md
  headers/
    session.js
```

#### spec.json

Spec files contain the complete map of your API, If you want a file to be available when
compiling your Blueprint, you must specify it here. We organize our files into endpoints,
schemas, examples, and headers, each in their respective folders.

```json
{
  "name": "Prolific Store",
  "inherit": "node_modules/pcf-specs",
  "version": "1.1.0",
  "features": [
    "overview",
    "endpoints/product",
    "models/product"
  ],
  "excludeEndpoints": {
    "/products/{id}/reviews": [
      "POST"
    ]
  }
}
```
A spec.json file can contain:

  - `name` - The name of the API.
  - `inherit` (optional) - Path to base spec to inherit from. See [Extends and Inherits](#extends-and-inherits-helpers) Helpers for details.
  - `version` - Semantic versioning of the specs (not the API).
  - `features` - Markdown files at the given path within the base and child spec folders.
  - `excludeEndpoints` (optional) - A map of endpoint paths to omit. If the value is an array, it will only omit those methods. If it is `true`, it will omit _all_ methods for that endpoint.

#### package.json

If you plan on extending a public base spec, like `pcf-specs`, initiate an npm `package.json` file:
```bash
$ npm init
```

Then install the spec:
```bash
$ npm install pcf-specs`
```

This will allow you to lock your spec to a specific version of the base spec using the `package.json` file.

#### overview.md

The introductory part of the spec, including title:

```
# Prolific Commerce API

This is the Prolific Commerce API. Enjoy!
```

#### endpoints/

This holds the markdown files that will be concatenated together. They also allow you to use Handlebars templating, providing several helpers:

```
# Group Products
These are the endpoints regarding products.

## Product [/products/{id}]

### Get Product [GET]
Gets the full product model for the given id.

+ Parameters

  + id (required, string, `12345`) ... The id of the product.

+ Response 200 (application/json; charset=utf-8)

  + Body

            {{example 'product'}}

  + Schema

            {{schema 'product'}}
```

The `example` helper inserts the JSON from `examples/product.json`, while `schema` inserts the JSON from `schemas/product.json`.
If a file is found in both the base and child spec, they are automatically merged, with the child being given precedence.

#### examples/

Holds example JSON bodies that endpoints return. Below is an example file.
Notice you can also use handlebars templating within a JSON file.

```
{
  "__exclude": ["rating"],
  "reviews": "{{example 'reviewCollection'}}",
  "materials": [
    "cotton",
    "polyester"
  ]
}
```
One caveat: If your example contains an array of objects, you need to make sure that
you always specify those objects in the same order, in both the child and base spec
in order to properly merge them together. If you want to extend an array of objects with a new object, you must add blank
object placeholders (ie: {}), in the child array, and then any new objects you want to add.

See [JSON Helpers](./json-helpers.md) to learn about `__exclude` and other functions.

#### schemas/

Includes body schemas to be included in endpoint files. These are optional,
but we find it useful to include them so you can use them for API validation.
You can use a tool like [this](http://jsonschemalint.com/) to test
your API.

#### models/

Includes blueprint files that describe each model. These are typically appended
at the end of the blueprint.

```
# Group Product Model

Description of the product model.

{{example 'product'}}

{{schema 'product'}}
```

#### Headers

Includes flat JSON files representing names and example values of headers.

```
{
  "sessionId": "a8d8f9ea108382374"
}
```
# Inheritance

We've modeled inheritance between a child and base spec as simply as possible. Any files
that appear in both the child and base specs will be merged together, with properties in
the child overriding properties in the base. This, combined with JSON helpers, lets you
easily modify a base spec to suit your needs.

It's worth noting that the fact that child properties take precedence has a special implication
when writing JSON schemas using version 4 of the specification. In this version, the required keys
are specified in an array that corresponds to the value of a separate property called required.
Said key is treated as a regular non-object property and because of that for any modifications it
must be overridden with an array containing **all** object properties, own and/or inherited,
intended to be obligatory. Non of the JSON helpers described in the following section has an
effect over it so it has to be manually managed.
