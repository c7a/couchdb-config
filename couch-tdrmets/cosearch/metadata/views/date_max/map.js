function(doc) {
  if (doc.date && doc.date[1]) {
    emit(doc.date[1].split(/-/), 1);
  }
}