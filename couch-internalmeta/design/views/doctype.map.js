function(doc) {
    emit([ ('approved' in doc ? "approved" : "not approved") , doc['type'] , doc['sub-type']], null);
}