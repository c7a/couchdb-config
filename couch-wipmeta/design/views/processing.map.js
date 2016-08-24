function(doc) {
    if (!('ingestReq' in doc) || !( 'processdate' in doc.ingestReq) ) {
        return;
    }
    emit([doc.ingestReq.processhost,doc.ingestReq.processdate],null);
}
