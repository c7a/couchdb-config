function(doc) {
    if ('components' in doc && 'order' in doc && Array.isArray(doc.order)) {
        var acomponent=doc.components[doc.order[0]];
        if(!("canonicalMaster" in acomponent) || acomponent.canonicalMaster === null) {
            emit(doc['_id'].split('.')[0],null);
        }
    }
}
