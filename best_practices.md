# Ballad Best Practices

This section is designed to help you get to know the best ways to make the capabilities of Ballad work for you.

### Composition

- Whenever possible try to break objects down to be as small as possible, you can always use the extends helper to add any new properties later on for specific cases. Leaving the base object as general as possible lets you reuse it in many different contexts with ease.

-  You can nest objects within each other with the include helper. This comes in handy when one of your models has another model that it owns/contains. A good example of this is that customers will probably have an address, but the warehouse model can have an address entry as well. Using the include helper will let you pull this base address model into both the customer and warehouse model, and modify them according to context.

- The description helper is very handy for being able to tailor an objects description to the exact context in which it is being used. For example, a customer may have 2 distinct addresses, one a billing address, and one a shipping address. You can use the description helper to change the description for each of those contexts.

- Files with the same name will automatically be merged between the base and child directories. Use this to your advantage and keep the bulk of the spec in the base spec, only using the child to override, remove and add changes. Avoid unnecessary duplication.

- Leave the base spec pretty open, don't use a lot of helpers in it. You want it to be as free of dependencies as possible. You want to avoid the scenario where you have to make changes to your base spec, since
