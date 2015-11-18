# Group Aliasing

Endpoint to test that a Parent only object using the { { schema 'schemaName'} } helper works

## Alias [/aliased]

### Get All Aliases [GET]

Test that the aliasSchema from the parent is properly loaded. Change the schema to 'aliasSchemaWorking' to see proper behavior

+ Response 200 (application/json; charset=utf-8)

  + Schema

            {{schema 'aliasSchema' }}