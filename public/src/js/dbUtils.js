var POSTS_STORE = 'posts';

var dbPromise = idb.open('posts-store', 1, function(db) {
  if (!db.objectStoreNames.contains(POSTS_STORE)) {
    db.createObjectStore(POSTS_STORE, { keyPath: 'id' });
  }
});

function writeData(storeName, data) {
  return dbPromise.then((db) => {
    var tx = db.transaction(storeName, 'readwrite');
    var store = tx.objectStore(storeName);

    store.put(data);

    return tx.complete;
  })
}
