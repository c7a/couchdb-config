function(doc) {
  if (doc.date) {
    emit(doc.date[0].split(/-/), 1);
  }
}