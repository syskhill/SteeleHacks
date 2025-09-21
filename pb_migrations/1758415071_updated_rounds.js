/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_225224730")

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "json88666607",
    "maxSize": 0,
    "name": "actions",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_225224730")

  // remove field
  collection.fields.removeById("json88666607")

  return app.save(collection)
})
