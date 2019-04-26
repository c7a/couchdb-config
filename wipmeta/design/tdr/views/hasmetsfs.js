module.exports = {
  map: function(doc) {
    if (
      "_attachments" in doc &&
      "filesystem" in doc &&
      "stage" in doc.filesystem
    ) {
      emit([doc.filesystem.stage, doc.updated], null);
    }
  }
};
