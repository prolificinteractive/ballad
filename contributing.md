# Contributing

If you find an issue/bug in this library, please let us know! Please submit an issue and 
post the steps to reproduce the issue and we'll proceed from there.

If you want to contribute some code, please feel free to do so, just run the tests
with the command `npm test`, make sure they all still pass, and then submit a pull request!

## Classes

### Spec

The Spec class is used to represent a full API Specification. It is initialized with the
contents of the spec.json file, and keeps track of its inherited spec(if any), and all the
endpoints that will be represented.

#### Functions

- `hasParent()`: Checks if the current spec has a parent that it inherits from.

- `load(baseDirectory)`: Looks for a `spec.json` file in the specified directory, and 
instantiates a new Spec using that file. 

- `getParentSpec()`: Returns the parent Spec, if it exists.

- `getAst()`: Loads up the .md files specified in a spec's features and converts them to a
[Blueprint JSON AST.](https://github.com/apiaryio/api-blueprint-ast). This function also
reorders the resources in the AST so that they match the order specified in the spec.json
file. This was done to prevent a bug that would order endpoints and models inconsistently.

- `renderBlueprint()`: Generates a Blueprint Markdown file.

- `createRenderContext()`: Creates a render context for the current spec.

### RenderContext

This class handles the duty of actually populating the handlebars helpers with the correct
information. It resolves the paths to all the json files referenced in a template, and then
renders a template.

#### Functions

- `resolveJsonModifiers(jsonObject)`: Resolve any Json helpers being used in the template.

- `renderTemplate(template)`: Fills in any handlebars helpers in the template, and returns a
markdown file.

- `getParentContext()`: Gets a render context for the parent spec, if it exists.

- `getJsonPromise(filename)`: Gets the specified files contents from the render contexts
json cache.

- `fetchTemplateDependencies(template)`: Gets the json dependencies for the template. Json is
then passed on to `resolveJsonModifiers` to have any modifiers present be resolved. 

- `loadJson(filename, context)`: Loads the actual json file from the file system. Checks
the json cache first, and only tries to load from the file system if not found in cache.
Also merges the json with parent json files, if applicable.

### SpecComponent

The SpecComponent class is used to resolve the handlebars helpers that you can use in your
json files. Has a `dependencies` property where all json used in the SpecComponent is 
cached.

#### Functions

- `getJson()`: Retrieves the json for a given helper and filename from cached dependencies.

- `render()`: Pass the markdown template through handlebars, replacing all instances of `{{ helper args}}`
helpers with the actual contents which are retrieved from the SpecComponents dependencies cache.
Passes `this` as the data object to handlebars, so any occurrences of `{{ helper args }}` will
map to either `this.example(args)`, `this.schema(args)` or `this.headers(args)`

- `example()`, `schema()`, `headers()`: These three functions will be called by handlebars, and 
return the correct contents from the json cache.

