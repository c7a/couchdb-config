function(doc) {
    if (!('ingestReq' in doc) || 'processdate' in doc.ingestReq ) {
        return;
    }
    if('ingestHistory' in doc && 
       Array.isArray(doc['ingestHistory']) &&
       doc.ingestHistory[0].date > doc.ingestReq.date ) {
        return;
    }
    emit(doc.ingestReq.date,null);
}
