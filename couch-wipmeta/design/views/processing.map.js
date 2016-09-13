function(doc) {
    if (!('ingestReq' in doc) || !( 'processhost' in doc.ingestReq)  ) {
        return;
    }
    emit([doc.ingestReq.processhost,doc.ingestReq.processdate],null);
}
