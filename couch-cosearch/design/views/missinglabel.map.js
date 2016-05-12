function(doc) {
    // For now looking for item_repository documents which need to be replicated
    if (!('label' in doc)) {
        emit(true, null);
    }
}
