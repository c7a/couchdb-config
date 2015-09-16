function(doc) {
    if (doc.type) {
        if (doc.type === 'item_repository') emit(doc.owner, [doc['manifest date'], doc.repository]);
        else if (doc.type === 'item') emit(doc._id, [doc['manifest date'], 'item']);
    }
}
