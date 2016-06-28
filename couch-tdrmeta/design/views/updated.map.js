function(doc) {
    if ('updated' in doc) {
        emit(doc.updated,null);
    }
}
