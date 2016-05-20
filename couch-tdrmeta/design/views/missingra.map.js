function(doc) {
    if (!('recentattach' in doc)) {
        emit(null,null);
    }
}
