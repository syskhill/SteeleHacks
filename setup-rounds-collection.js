// Run this script to set up the rounds collection in PocketBase
// You can copy this JSON and import it manually in PocketBase admin

const roundsCollectionSchema = {
  "name": "rounds",
  "type": "base",
  "schema": [
    {
      "name": "userId",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "_pb_users_auth_",
        "cascadeDelete": false,
        "minSelect": null,
        "maxSelect": 1,
        "displayFields": []
      }
    },
    {
      "name": "seed",
      "type": "text",
      "required": true,
      "options": {
        "min": null,
        "max": null,
        "pattern": ""
      }
    },
    {
      "name": "startedAt",
      "type": "date",
      "required": true,
      "options": {
        "min": "",
        "max": ""
      }
    },
    {
      "name": "endedAt",
      "type": "date",
      "required": false,
      "options": {
        "min": "",
        "max": ""
      }
    },
    {
      "name": "outcomes",
      "type": "json",
      "required": false,
      "options": {}
    }
  ],
  "listRule": "userId = @request.auth.id",
  "viewRule": "userId = @request.auth.id",
  "createRule": "userId = @request.auth.id",
  "updateRule": "userId = @request.auth.id",
  "deleteRule": "userId = @request.auth.id",
  "options": {}
};

console.log("Copy this JSON to create the rounds collection:");
console.log(JSON.stringify(roundsCollectionSchema, null, 2));