/**
 * Server-side stub for Dexie (IndexedDB wrapper).
 * The real Dexie only works in the browser. On the server all operations
 * are no-ops so that class-level definitions like:
 *   class GrassrootsDB extends Dexie { ... }
 *   export const db = new GrassrootsDB()
 * don't throw during SSR / static pre-rendering.
 */

function Dexie(name) {
  this.name = name;
}

const noopTable = {
  toArray: () => Promise.resolve([]),
  toCollection: () => ({ toArray: () => Promise.resolve([]), count: () => Promise.resolve(0) }),
  put: () => Promise.resolve(undefined),
  add: () => Promise.resolve(undefined),
  get: () => Promise.resolve(null),
  delete: () => Promise.resolve(),
  clear: () => Promise.resolve(),
  where: () => ({ equals: () => ({ first: () => Promise.resolve(null), toArray: () => Promise.resolve([]) }) }),
  bulkPut: () => Promise.resolve(),
  bulkAdd: () => Promise.resolve(),
  count: () => Promise.resolve(0),
  orderBy: () => noopTable,
  reverse: () => noopTable,
  limit: () => noopTable,
  offset: () => noopTable,
  filter: () => noopTable,
};

Dexie.prototype.version = function () { return { stores: () => this }; };
Dexie.prototype.open = function () { return Promise.resolve(this); };
Dexie.prototype.close = function () {};
Dexie.prototype.table = function () { return noopTable; };
Dexie.prototype.on = function () { return { subscribe: () => ({ unsubscribe: () => {} }) }; };
Dexie.prototype.transaction = function (_, _tables, cb) {
  return Promise.resolve().then(() => typeof cb === 'function' ? cb() : undefined);
};

// Allow subclasses to define typed table properties via decorators / assignment.
Dexie.prototype.matches = noopTable;
Dexie.prototype.sessions = noopTable;
Dexie.prototype.notifications = noopTable;
Dexie.prototype.players = noopTable;
Dexie.prototype.drafts = noopTable;

Dexie.liveQuery = function (fn) {
  return { subscribe: () => ({ unsubscribe: () => {} }) };
};

class Table {}
class Collection {}

module.exports = Dexie;
module.exports.default = Dexie;
module.exports.Dexie = Dexie;
module.exports.Table = Table;
module.exports.Collection = Collection;
module.exports.liveQuery = Dexie.liveQuery;
