module.exports = {
  map: function(doc) {
    if (
      "exportHistory" in doc ||
      "exportReq" in doc ||
      "ingestHistory" in doc ||
      "ingestReq" in doc
    ) {
      emit(null, null);
    }
  }
};
