# Group Tours

## Tours [/tours]

### Get all Tour routes [GET]
Get all the tours available in the Bronx Zoo.

+ Request (application/json; charset=utf-8)

  + Headers

            {{header 'session'}}

+ Response 200 (application/json; charset=utf-8)

  + Body

            {{example 'tours'}}

  + Schema

            {{schema 'tours'}}

### Add New Tour [POST]
Add a new tour at the Bronx zoo.

+ Request (application/json; charset=utf-8)

  + Headers

            {{header 'session'}}

  + Body

            {{example 'tour'}}

+ Response 201 (application/json; charset=utf-8)

  + Body

            {{example 'tour'}}

  + Schema

            {{schema 'tour'}}

## Tour [/tours/{tour_id}]

### Get Specific Tour [GET]
Get information about a specific tour.

+ Parameters

  + tour_id (required, string, `A25B`) ... The `id` of the tour.

+ Request (application/json; charset=utf-8)

  + Headers

            {{header 'session'}}

+ Response 200 (application/json; charset=utf-8)

  + Body

            {{example 'tour'}}

  + Schema

            {{schema 'tour'}}


### Update a Tour [PUT]
Update an tour at the Bronx Zoo

+ Parameters

  + tour_id (required, string, `A25B`) ... The `id` of the tour.

+ Request (application/json; charset=utf-8)

  + Headers

            {{header 'session'}}

  + Body

            {{example 'tour'}}

+ Response 200 (application/json; charset=utf-8)

  + Body

            {{example 'tour'}}

  + Schema

            {{schema 'tour'}}

### Remove a Tour [DELETE]
Remove a tour from the Bronx Zoo

+ Parameters

  + tour_id (required, string, `A25B`) ... The `id` of the tour.

+ Response 200 (application/json; charset=utf-8)
