function(doc) {
    if ('pubmin' in doc) {
        emit(doc.pubmin, null );
    }
}
