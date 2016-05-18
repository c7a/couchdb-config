function(doc) {
    var recentupdate = "0";
    var hammermd5;

    if ('attachInfo' in doc) {
        Object.keys(doc.attachInfo).forEach(function(md5) {
            var attach=doc.attachInfo[md5];
            if ('pathDate' in attach) {
                if (attach.pathDate > recentupdate) {
                    recentupdate=attach.pathDate;
                    hammermd5=md5;
                }
            } else if ('fileDate' in attach) {
                if (attach.fileDate > recentupdate) {
                    recentupdate=attach.fileDate;
                    hammermd5=md5;
                }
            } else if ('uploadDate' in attach) {
                if (attach.fileDate > recentupdate) {
                    recentupdate=attach.uploadDate;
                    hammermd5=md5;
                }
            }
        });
    }
    if ('updatereq' in doc) {
        if (recentupdate > "0" && doc.updatereq > recentupdate) {
            recentupdate=doc.updatereq;
        }
    }

    if (('hammer' in doc) 
        && ('date' in doc.hammer)
        && (doc.hammer.date > recentupdate)) {
        return;
    }
    if (recentupdate> "0") emit(recentupdate,hammermd5);
}
