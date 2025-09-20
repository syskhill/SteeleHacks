/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // Create 'users' collection
    const users = app.schema.createCollection('users', {
      type: 'base',
      listRule: '@request.auth.id = id',
      viewRule: '@request.auth.id = id',
      createRule: '',
      updateRule: '@request.auth.id = id',
      deleteRule: '@request.auth.id = id'
    });
    users.addText('username', { required: true, unique: true });
    users.addNumber('chips', { required: true, min: 0, max: 1000000, default: 1000 });
    users.createIndex('CREATE UNIQUE INDEX idx_username ON users (username)');

    // Create 'rounds' collection
    const rounds = app.schema.createCollection('rounds', {
      type: 'base',
      listRule: 'userId = @request.auth.id',
      viewRule: 'userId = @request.auth.id',
      createRule: 'userId = @request.auth.id',
      updateRule: 'userId = @request.auth.id',
      deleteRule: 'userId = @request.auth.id'
    });
    rounds.addRelation('userId', 'users', { required: true });
    rounds.addText('seed', { required: true });
    rounds.addDate('startedAt', { required: true });
    rounds.addDate('endedAt', { required: false });
    rounds.addJson('outcomes', { required: true });
    rounds.createIndex('CREATE INDEX idx_userId ON rounds (userId)');
  },
  (app) => {
    app.schema.removeCollection('rounds');
    app.schema.removeCollection('users');
  }
);
