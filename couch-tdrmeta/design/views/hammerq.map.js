function(doc) {
    var recentupdate = "0";

    if ('_attachments' in doc) {
        Object.keys(doc._attachments).forEach(function(name) {
            if (name > recentupdate) {
                recentupdate=name;
            }
        });
    }
    if ('updatereq' in doc) {
        if (doc.updatereq > recentupdate) {
            recentupdate=doc.updatereq;
        }
    }

    if (('hammer' in doc) 
        && ('date' in doc.hammer)
        && (doc.hammer.date > recentupdate)) {
        return;
    }
    if (recentupdate> "0") emit(recentupdate,null);
}