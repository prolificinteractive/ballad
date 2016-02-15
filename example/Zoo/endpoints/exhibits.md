# Group Exhibits

## Exhibits [/exhibits]

### Get all Exhibits [GET]
Get all the exhibits in the Zoo.

+ Request (application/json; charset=utf-8)

  + Headers

            {{header 'session'}}

+ Response 200 (application/json; charset=utf-8)

  + Body

            {{example 'allExhibits'}}

  + Schema

            {{schema 'allExhibits'}}

### Add New Exhibit [POST]
Add a new exhibition to the zoo.

+ Request (application/json; charset=utf-8)

  + Headers

            {{header 'session'}}

  + Body

            {{example 'exhibit'}}

+ Response 201 (application/json; charset=utf-8)

  + Body

            {{example 'exhibit'}}

  + Schema

            {{schema 'exhibit'}}

## Exhibit [/exhibits/{exhibit_id}]

### Get Specific Exhibit [GET]
Get information about a specific exhibit.

+ Parameters

  + exhibit_id (required, string, `12345`) ... The `id` of the exhibit.

+ Request (application/json; charset=utf-8)

  + Headers

            {{header 'session'}}

+ Response 200 (application/json; charset=utf-8)

  + Body

            {{example 'exhibit'}}

  + Schema

            {{schema 'exhibit'}}


### Update an Exhibit [PUT]
Update an exhibit in the zoo

+ Parameters

  + exhibit_id (required, string, `12345`) ... The `id` of the exhibit.

+ Request (application/json; charset=utf-8)

  + Headers

            {{header 'session'}}

  + Body

            {{example 'exhibit'}}

+ Response 200 (application/json; charset=utf-8)

  + Body

            {{example 'exhibit'}}

  + Schema

            {{schema 'exhibit'}}

### Remove an Exhibit [DELETE]
Remove an exhibition from the zoo

+ Parameters

  + exhibit_id (required, string, `12345`) ... The `id` of the exhibit.

+ Response 200 (application/json; charset=utf-8)