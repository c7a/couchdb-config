module.exports = {
  map: function(doc) {
    if (!("exportReq" in doc) || !("exportdate" in doc.exportReq)) {
      return;
    }
    emit([doc.exportReq.exporthost, doc.exportReq.exportdate], null);
  }
};
