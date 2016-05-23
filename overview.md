# Overview of how Ballad works

## Docs Command
The `docs` command is probably the command that you will use the most when you 
are working with Ballad. This command is used to generate the final HTML file
from the spec.json file and all the endpoints and models specified within.
The first thing this command does, is to load up the spec.json in the specified
directory, and use that file to create a new instance of the Spec class.
Once the Spec has been instantiated, we call its `renderBlueprint` method.
This method handles all of the logic of taking the endpoints that you've written, 
and turning them into a valid blueprint. This blueprint is then passed to aglio 
and rendered into HTML using its default template. If you like, you can pass a 
new template to Aglio as well, and output using whatever custom style that you'd
like. 

## Build Command
The `build` command is similar to the `docs` command, except that it does not
render the final HTML for you. Instead you can just output the blueprint 
markdown file. This can be useful for testing and determining if any errors in 
the expected output are due to your spec or a transform being done in Aglio.

## Validate command
The `validate` command lets you quickly make sure that your Spec is valid, and 
all files are located where they should be. 

## Serve command
The `serve` command lets you preview your generated HTML file. It is a built in 
feature of Aglio, and will start a local HTTP server and serve your generated 
HTML. This is a quick way to be able to view your final output without having to
deploy the file onto an external web server.

# Spec Generation Overview

## Initialize the spec
This step goes through a specific directory and checks for a spec.josn file.
This file should contain a list of all the endpoint files in the Spec in an array
named `features`. This lets you easily add or remove endpoints in one central location.

## Load the endpoint files
The next step loads up all the endpoint files, which should be markdown files, and
makes sure that all the files specified in the Specs `features` array are present.
We also check here if the Spec has a Parent Spec and also load up the endpoint
files that it requires.

## Generate the initial Blueprint
We next generate an initial version of the final Blueprint markdown file.
This intial version still contains any `{{ }}` helpers that you may have used in
the endpoint files. We don't worry about populating the content of those yet.

## Resolve Helpers
The final step is to resolve all the helper properties that you may be using. 
We go through the initial blueprint file and look for any instances of text surrounded
by `{{ }}` and parse the contents as calls to a method in our SpecComponent class.
This class determines which JSON file it should load, and then swaps the correct
content into the blueprint.


