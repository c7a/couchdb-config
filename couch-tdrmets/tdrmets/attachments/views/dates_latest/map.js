function(doc) {
  if (doc._attachments) {
    emit(Object.keys(doc._attachments).sort().pop().split(/\D/).slice(0,7), 1);
  }
}