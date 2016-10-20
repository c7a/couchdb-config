function(doc) {
    if (!('processReq' in doc) || !Array.isArray(doc.processReq) || 
        doc.processReq.length === 0 || !( 'processhost' in doc.processReq[0])) {
        return;
    }
    emit([doc.processReq[0].processhost,doc.processReq[0].request,doc.processReq[0].processdate],null);
}
