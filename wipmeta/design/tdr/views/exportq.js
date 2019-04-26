module.exports = {
  map: function(doc) {
    if (
      !("processReq" in doc) ||
      !Array.isArray(doc.processReq) ||
      doc.processReq.length === 0
    ) {
      return;
    }
    var req = doc.processReq[0];
    if ("request" in req && req.request === "export") {
      if (!("processhost" in req)) {
        emit(req.date, null);
      }
    }
  }
};
