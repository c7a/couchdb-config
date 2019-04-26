module.exports = {
  map: function(doc) {
    if ("repos" in doc && Array.isArray(doc.repos)) {
      emit(doc.repos.length, null);
    }
  }
};
