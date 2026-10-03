import pg from 'pg';

// Loaded only by CLI boundary tests. No PostgreSQL connection may leave this child.
pg.Pool.prototype.connect = function () {
  process.stderr.write('PG_CONNECTION_INTERCEPTED\n');
  throw Object.assign(new Error('Fixture intercepted connection before network access.'), {
    code: 'PG_CONNECTION_INTERCEPTED',
  });
};
