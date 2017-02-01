function(doc) {
    if (!('processHistory' in doc) || !Array.isArray(doc.processHistory) || doc.processHistory.length === 0) {
        return;
    };
    doc.processHistory.every(function(req) {
        if ('request' in req && req.request === 'imageconv') {
            emit ([req.status,req.message !== "",req.date],null);
            return false;
        }
        return true;
    });
}
