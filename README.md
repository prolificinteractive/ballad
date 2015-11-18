# Ballad

Assemble API Blueprint specifications with concatenation, templating, and inheritance.

Ballad is designed to write API documentation quickly and easily, using composition and 
keeping things [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself).

Each component of your specifications should be written with the [API Blueprint](https://apiblueprint.org/) 
format. [Check out how to write Blueprints here](https://docs.apiary.io/api_101/api_blueprint_tutorial/).

Ballad was build with the [spoke-hub distribution paradigm](https://en.wikipedia.org/wiki/Spoke%E2%80%93hub_distribution_paradigm) 
in mind, meaning it easily allows the creation of API specifications derived from a base one, in an object-oriented manner.

# Table of Contents
  1. [Installation](#installation)
  2. [Setting Up a Spec](#setting-up-a-spec)
  3. [JSON Helpers](#json-helpers)
  4. [Usage Examples](#usage-examples)

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

See [JSON Helpers](#json-helpers) to learn about `__exclude` and other functions.

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

# JSON Helpers

One of the main features you will be using to put together your blueprints will be the helpers 
we provide. These helpers are designed to let you compose JSON files by pulling in other json 
files and modifying them as you see fit in that particular context. This lets you reuse files that
you've already created, and just specify the differences, instead of duplicating content. Just 
use them in your json file as normal keys and values and the correct files will be pulled in at 
compile time.

### Extends and Inherits Helpers

This helper is used when you want to create a new json file using an existing file as the 
base. You can then add keys as you see fit.

* `"__extends": "directory/file"`
* `"__inherits"` - this is an alias for `__extends`, they can be used interchangeably.

__Example__  

``` json
{  
  "__extends": "schemas/user",  
  "shoeSize": "float",  
  "favoriteColor": "string"  
}
```
    
  In this example, we pull in an existing user.json file from the schema directory, and then 
  add the properties 'shoeSize' and 'favoriteColor' to it.

### Include Helper

This helper _only_ uses specified keys. Can be used anywhere in JSON object. Takes 
precedence over `__exclude`.

* `"__include": ["key1", "key2"...]`

__Example__  

``` json
{
  "__extends": "schemas/user",
  "__include": ["firstName", "lastName", "birthday", "age"]
}
```
        
In this example, we pull in an existing user.json file from the schema directory, 
but only use the 'firstName', 'lastName','birthday' and 'age' properties.

### Exclude Helper
This helper omits the specified keys from the extended file. Must be nested within the object whose key you want to remove.

* `"__exclude": ["key1", "key2"...]`

__Example__  

``` json
{
  "__extends": "schemas/user",
  "__exclude": ["birthday"]
}
```

In this example, we pull in an existing user.json file from the schema directory, 
but exclude the 'birthday' property.

### Aliasing Helper

This helper lets you pull in another json file as a property in the current json
file. This lets you quickly build new json files by composing together your existing
files. It automatically checks the base and child spec folders for the existence of
the file, and will merge the two together.

* `"key": "{{ schema [file] [required] [description] }}"` 
    - `file`:  Single quoted string. The name of the schema file you want to load.
    - `required`: Boolean value. Indicates a required value in the schema. Default: true.
    - `description`: Single quoted string. A description of the schema. It will override 
    any description specified in the schema file.
    - You can not specify a description without explicitly specifying the required value
  
__Example__  

``` json
{
  "car": {
    "wheels": "{{ schema 'wheels' true 'Current wheels' }}",
    "seats": "{{ schema 'seats' true 'Seat type'}}",
    "currentEngine": "{{ schema 'dieselEngine' true 'Engine Type'}}"
  }
}
```

This example pulls in the schema file carMake.json. It will look for the file in both the
base and child spec, and merge them together. It explicitly sets the description field, 
and will override any description specified in the carMake.json file.

###### Non-Schema Versions

There are versions of the above helper for other filetypes as well. We have created helpers 
for models, examples, and headers. They do not accept the `required` field.

* `"key": "{{ example [exampleName] [description] }}"`
    - Same as above, but pulls in files from the **_examples_** directory.

* `"key": "{{ header [headerName] [description] }}"`
    - Same as above, but pulls in files from the **_headers_** directory.

* `"key": "{{ model [modelName] [description] }}"`
    - Same as above, but pulls in files from the **_models_** directory.
     
## Usage Examples 

In the following example we're going to demonstrate the usage of a base spec, and a child
spec, and see how we can use this tool to generate a new API spec by combining the two in
a few different ways. We can extend the base spec with new endpoints and schemas, 
modify existing schemas by adding and removing properties, and we can reuse schemas in 
different contexts.

For the examples we will be using the following files:

###__SPEC FILES__

####Base  `./node_modules/prolific-specs/spec.json`
``` json
{
  "name": "e_commerce_base_spec",
  "version": "1.0.0",
  "features": [
    "overview",

    "endpoints/cart",
    "endpoints/product"
  ]
}
```

####Child   `./spec.json`

We specify the spec to inherit from by passing the directory containing the spec with the 
"inherit" key. We're assuming here that the base spec has been installed as a dependency 
of the child spec in its package.json file, but that's not a requirement. A spec.json file
must exist in this directory. You could easily change this if you wanted to write your own 
base spec as well. You should also note that the base spec only has endpoints for cart and 
product, while the child has endpoints for user. The final generated spec will have all 
three endpoints.

``` json
{
  "inherit": "node_modules/prolific-specs",
  "name":    "e_commerce_subspec",
  "version": "1.0.0",
  "features": [
    "overview",

    "endpoints/user"
  ]
}
```
### __ENDPOINTS__ 
These are the individual endpoints to the API. They are Markdown files written according 
to the Blueprint specifications. [Check out how to write Blueprints here.](https://apiary.io/blueprint)

####Cart Endpoint (base) `./node_modules/prolific-specs/endpoints/cart.md`
```
# Group Cart
This handles all of the cart related endpoints.  Including the checkout process, and cart
finalization.

## Cart [/cart]
These endpoints handle viewing and editing the user's cart.

### Get Cart [GET]
Returns the cart for the current user.

+ Request (application/json; charset=utf-8)

  + Headers

            {{header 'session'}}

+ Response 200 (application/json; charset=utf-8)

  + Body

            {{example 'cart'}}

  + Schema

            {{schema 'cart'}}
```

####Product Endpoint (base) `./node_modules/prolific-specs/endpoints/products.md`
```
# Group Products
These are the endpoints regarding products.  They are used for browsing all of the products offered.
They provide endpoints for getting lists of products through search, as well as get details for a
specific product.

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

####User Endpoint (child) `./endpoints/users.md`
This endpoint is only being specified in the child.
```
# Group User

Used to get user and profile information, as well as create, login, and logout accounts.

## User [/user]

### Get User [GET]
Gets the current users basic information.

+ Request (application/json; charset=utf-8)

  + Headers

            {{headers 'session'}}

+ Response 200 (application/json; charset=utf-8)

  + Body

            {{example 'user'}}

  + Schema

            {{schema 'user'}}
```

### __SCHEMAS__ 
#### Cart Schema 
**Base**   `./node_modules/prolific-specs/schemas/cart.json`
``` json
{
  "title": "Cart",
  "type": "object",
  "description": "The full cart, detailing all information known about a cart.",
  "required": true,
  "properties": {
    "tax": {
      "type": ["number", "null"],
      "required": true,
      "description": "Tax on the cart."
    },
    "total": {
      "type": "number",
      "required": true,
      "description": "Total cost of the cart."
    },
    "shippingWeight": {
      "type": "number",
      "required": true,
      "description": "Total weight of items in the cart"
    }
  }
}
```

**Child** `./schemas/cart.json`
``` json
{
  "properties": {
    "__exclude": ["shippingWeight"],
    "tariff": {
      "type": "number",
      "required": true,
      "description": "Extra tax calculated on exports"
    }
  }
}
```
#### ___Editing the base spec via exclusion___
In this cart schema example, the `shippingWeight` property in the base spec is being excluded, via the __exclude JSON helper, and a new property, `tariff`, is being added. All the keys in both the parent and child specs will be merged, and then any JSON helpers will be run. this will result in the following object:
``` json
{
  "title": "Cart",
  "type": "object",
  "description": "The full cart, detailing all information known about a cart.",
  "required": true,
  "properties": {
    "tax": {
      "type": ["number", "null"],
      "required": true,
      "description": "Tax on the cart."
    },
    "total": {
      "type": "number",
      "required": true,
      "description": "Total cost of the cart."
    },
    "tariff": {
      "type": "number",
      "required": true,
      "description": "Extra tax calculated on exports"
    }
  }
}
```
 This is one of the way we can use inheritance and exclusion to our advantage. 


#### Product Schema
**Base** `./node_modules/prolific-specs/schemas/product.json`
``` json
{
  "title": "Product",
  "type": "object",
  "required": true,
  "description": "Describes a full product.",
  "properties": {
    "name": {
      "type": "string",
      "required": true,
      "description": "Name of the product"
    },
    "price": {
      "type": "number",
      "required": true,
      "description": "Price of the product"
    }
  }
}
```

**Child** `./schemas/product.json`
```
No file. There are no changes from what's in the base spec.
```


####User Schema
**Base**
```
This file does not exist in the base spec.
```

**Child** `./schemas/user.json`
``` json
{
  "title":       "User",
  "type":        "object",
  "description": "Describes a user.",
  "required":    true,
  "properties":  {
    "firstName": {
      "type":        "string",
      "required":    true,
      "description": "User's first name."
    },
    "lastName":  {
      "type":        "string",
      "required":    true,
      "description": "User's last name."
    },
    "email":  {
      "type":        "string",
      "required":    true,
      "description": "User's email."
    }
  }
}
```

####Address Schema
**Base**
```
This file does not exist in the base spec.
```

**Child** `./schemas/address.json`
``` json
{
  "title": "Address",
  "type": "object",
  "description": "Contains information pertaining to an address.",
  "required": true,
  "properties": {
    "address1": {
      "type": "string",
      "required": true,
      "description": "First street address field."
    },
    "city": {
      "type": "string",
      "required": true,
      "description": "City on address."
    },
    "state": {
      "type": ["string", "null"],
      "required": true,
      "description": "State (or region/province) on address. The recommendation for this value is for it to be a standard state/region/province abbreviation so that it can be used with the 'countries' endpoint, but implementations may vary depending on requirements."
    },
    "country": {
      "type": "string",
      "required": true,
      "description": "Country on address. The recommendation for this value is for it to be a standard country abbreviation so that it can be used with the 'countries' endpoint, but implementations may vary depending on requirements."
    },
    "zip": {
      "type": "string",
      "required": true,
      "description": "Postal code on address."
    }
  }
}
```


###___Including an object___

Now let's say we wanted to have our user schema also have an address as one of it's properties. The quickest way to do this would be to just have it reference the address schema. Here's how we do that, using one of the JSON helpers:

``` json
{
  "title":       "User",
  "type":        "object",
  "description": "Describes a user.",
  "required":    true,
  "properties":  {
    "firstName": {
      "type":        "string",
      "required":    true,
      "description": "User's first name."
    },
    "lastName":  {
      "type":        "string",
      "required":    true,
      "description": "User's last name."
    },
    "email":  {
      "type":        "string",
      "required":    true,
      "description": "User's email."
    },
    "address": "{{schema 'address'}}"
  }
}
```
Just by using our JSON helpers, we've grafted one schema onto another, with minimal effort. 


###___Extending an object___

Extending a pre-existing object is also simple. Let's say we wanted to create a new type of product called giftcard. It would need all the existing properties of a product, but also a few new ones. Here's how we can accomplish that:

**Child** `./schemas/giftCard.json`
``` json
{
  "__extends": "schemas/product",
  "properties": {
    "startingValue": {
      "type": "number",
      "required": "true",
      "description": "Value of the card"
    }
    "activationStatus": {
      "type": "boolean",
      "required": "true",
      "description": "Wether the card has been activated or not"
    }
  }
}
```

This will result in the following object for the giftCard schema: 
``` json
{
  "title": "Product",
  "type": "object",
  "required": true,
  "description": "Describes a full product.",
  "properties": {
    "name": {
      "type": "string",
      "required": true,
      "description": "Name of the product"
    },
    "price": {
      "type": "number",
      "required": true,
      "description": "Price of the product"
    },
    "startingValue": {
      "type": "number",
      "required": "true",
      "description": "Value of the card"
    },
    "activationStatus": {
      "type": "boolean",
      "required": "true",
      "description": "Whether the card has been activated or not"
    }
  } 
}
```

## Known Issues

One known issue is the ordering of the final spec. Right now all endpoints and models
are listed alphabetically in the final output, and there is no way to change this.
We are working on a fix, and will release that as soon as it's ready.
