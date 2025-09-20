/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4285667772")

  // update collection data
  unmarshal({
    "name": "test2"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4285667772")

  // update collection data
  unmarshal({
    "name": "test"
  }, collection)

  return app.save(collection)
})
