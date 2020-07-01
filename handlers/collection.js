const { v4: uuid } = require("uuid");
const Boom = require("@hapi/boom");
const db = require("../db");
const { getPrefixedEntries } = require("../util");

async function createCollection(request) {
  const collectionKey = `${request.params.user}/${request.params.collection}`;
  try {
    await db.get(collectionKey);
    return Boom.badRequest();
  } catch (err) {
    if (!err.notFound) {
      console.error(request.method, request.path, err);
      return Boom.internal();
    }

    const collection = {
      id: uuid(),
    };
    await db.put(collectionKey, JSON.stringify(collection));
    return collection;
  }
}

async function getCollections(request) {
  try {
    return await getPrefixedEntries(db, `${request.params.user}/`);
  } catch (err) {
    if (!err.notFound) {
      console.error(request.method, request.path, err);
      return Boom.internal();
    }
    return Boom.notFound();
  }
}

module.exports = { createCollection, getCollections };
