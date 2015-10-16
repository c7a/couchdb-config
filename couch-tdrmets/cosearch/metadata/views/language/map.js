function(doc) {
  for (var i in doc.language) {
    emit(doc.language[i], 1);
  }
}