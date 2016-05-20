function(doc) {
    if (!('recentattach' in doc)) {
        return;
    }

    var recentupdate = doc.recentattach.date;
    if ('updatereq' in doc && doc.updatereq > recentupdate) {
        recentupdate=doc.updatereq;
    }

    if (('hammer' in doc) 
        && ('date' in doc.hammer)
        && (doc.hammer.date > recentupdate)) {
        return;
    }
    emit(recentupdate,null);
}
