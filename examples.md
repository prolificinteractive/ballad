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
base spec as well. If a parent spec is specified in this way, the child spec will have access to all the files in the parent, including its endpoints.

``` json
{
  "inherit": "node_modules/prolific-specs",
  "name":    "e_commerce_subspec",
  "version": "1.0.0",
  "features": [
    "overview",
    "endpoints/cart",
    "endpoints/product",
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
    },
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

