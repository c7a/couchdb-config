function(doc) {
    if (!('processHistory' in doc) || !Array.isArray(doc.processHistory) || doc.processHistory.length === 0) {
        return;
    };
    req=doc.processHistory[0];
    if (req.request === 'silence') {
        return;
    }
    datep=req.date.split("T");
    emit ([req.status,req.message !== "",datep[0],datep[1]],req.request);
}
