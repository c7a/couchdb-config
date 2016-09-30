function(doc) {
    if ('exportHistory' in doc) {
        emit ([doc.exportHistory[0].status,doc.exportHistory[0].message !== "",doc.exportHistory[0].date],null);
    }
}
