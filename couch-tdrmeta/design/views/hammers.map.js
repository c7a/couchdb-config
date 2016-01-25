function(doc) {
    if ('hammer' in doc) {
        emit ([doc.hammer.status,doc.hammer.date],null);
    }
}
