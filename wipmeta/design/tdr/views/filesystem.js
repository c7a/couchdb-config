module.exports = {
  map: function(doc) {
    if ("filesystem" in doc) {
      if ("stage" in doc.filesystem) {
        emit(
          [
            doc.filesystem.configid,
            doc.filesystem.stage,
            doc.filesystem.identifier
          ],
          null
        );
      }
    }
  }
};
