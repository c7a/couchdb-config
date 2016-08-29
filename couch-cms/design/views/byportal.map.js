function(doc) {
    if (Array.isArray(doc['portal'])) {
        doc['portal'].forEach(function(portal) {
            emit([portal,doc['changed']],null);
        });
    }
}
