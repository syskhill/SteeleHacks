/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_225224730")

  // update collection data
  unmarshal({
    "listRule": "",
    "viewRule": ""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_225224730")

  // update collection data
  unmarshal({
    "listRule": "userId = @request.auth.id",
    "viewRule": "userId = @request.auth.id"
  }, collection)

  return app.save(collection)
})
