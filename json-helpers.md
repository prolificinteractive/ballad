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

