function(doc) {
    if (!('exportReq' in doc) || !( 'exporthost' in doc.exportReq)  ) {
        return;
    }
    emit([doc.exportReq.exporthost,doc.exportReq.exportdate],null);
}
