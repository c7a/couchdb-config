function(doc) {
  if (doc._attachments) {
    emit(Object.keys(doc._attachments).length, 1);
  }
}