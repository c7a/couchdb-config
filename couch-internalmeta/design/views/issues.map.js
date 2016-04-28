function(doc) {

    // Only processing issues of series
    if (!('parent' in doc)) {
        return;
    }

    emit(doc.parent, { label: doc['label'] , pubmin: doc['pubmin'] } );
}