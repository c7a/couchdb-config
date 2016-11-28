function(doc) {
    if (!('processHistory' in doc) || !Array.isArray(doc.processHistory) || doc.processHistory.length === 0) {
        return;
    };
    req=doc.processHistory[0];
    emit ([req.status,req.message !== "",req.date],req.request);
}
