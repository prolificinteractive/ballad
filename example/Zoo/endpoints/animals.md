# Group Animals

## Animals [/animals]

### Get all Animals [GET]
Get all the animals in the Zoo.

+ Request (application/json; charset=utf-8)

  + Headers

            {{header 'session'}}

+ Response 200 (application/json; charset=utf-8)

  + Body

            {{example 'allAnimals'}}

  + Schema

            {{schema 'allAnimals'}}

### Add New Animal [POST]
Add a new animal to the zoo.

+ Request (application/json; charset=utf-8)

  + Headers

            {{header 'session'}}

  + Body

            {{example 'animal'}}

+ Response 201 (application/json; charset=utf-8)

  + Body

            {{example 'animal'}}

  + Schema

            {{schema 'animal'}}

## Animal [/animals/{animal_id}]

### Get Specific Animal [GET]
Get information about a specific animal.

+ Parameters

  + animal_id (required, string, `kangaroo`) ... The `id` of the animal.

+ Request (application/json; charset=utf-8)

  + Headers

            {{header 'session'}}

+ Response 200 (application/json; charset=utf-8)

  + Body

            {{example 'animal'}}

  + Schema

            {{schema 'animal'}}


### Update an Animal [PUT]
Update an animal in the zoo

+ Parameters

  + animal_id (required, string, `kangaroo`) ... The `id` of the animal.

+ Request (application/json; charset=utf-8)

  + Headers

            {{header 'session'}}

  + Body

            {{example 'animal'}}

+ Response 200 (application/json; charset=utf-8)

  + Body

            {{example 'animal'}}

  + Schema

            {{schema 'animal'}}

### Remove an Animal [DELETE]
Remove an animal from the zoo

+ Parameters

  + animal_id (required, string, `kangaroo`) ... The `id` of the animal.

+ Request (application/json; charset=utf-8)

  + Headers

            {{header 'session'}}

+ Response 200 (application/json; charset=utf-8)