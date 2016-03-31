function(doc) {
    if (doc.type && doc.type === 'aip'
        && (!doc['sub-type'] || doc['sub-type'] !== 'deleted')) {
        
        var present;
        if (doc._attachments && doc._attachments['cmr.xml']) {
            present=1;
        } else {
            present=0;
        }
        emit([present,doc._id], null);
    }
}