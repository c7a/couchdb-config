function(doc) {
  emit(doc.date_uploaded_couch, [doc._id, doc._attachments]);
}