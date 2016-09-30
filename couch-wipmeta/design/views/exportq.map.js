function(doc) {
    if (!('exportReq' in doc) || 'exporthost' in doc.exportReq ) {
        return;
    }
    emit(doc.exportReq.date,null);
}
