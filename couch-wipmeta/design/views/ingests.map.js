function(doc) {
    if ('ingestHistory' in doc) {
        emit ([doc.ingestHistory[0].status,doc.ingestHistory[0].message !== "",doc.ingestHistory[0].date],null);
    }
}
