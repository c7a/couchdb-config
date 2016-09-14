function(doc) {
    if (!('block' in doc) && Array.isArray(doc['portal'])) {
        doc['portal'].forEach(function(portal) {
            emit([portal,doc['changed']],null);
        });
    }
}
