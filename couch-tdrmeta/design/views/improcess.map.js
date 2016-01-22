function(doc) {
    var recentattach = "0";

    if ('_attachments' in doc) {
        Object.keys(doc._attachments).forEach(function(name) {
            if (name > recentattach) {
                recentattach=name;
            }
        });
    }
    if (('imProcess' in doc) 
        && ('date' in doc.imProcess)
        && (doc.imProcess.date > recentattach)) {
        return;
    }
    if (recentattach> "0") emit(recentattach,null);
}