function(doc) {
    var dup = 0;
    if ('attachInfo' in doc) {
        Object.keys(doc.attachInfo).forEach(function(md5) {
            if ('paths' in doc.attachInfo[md5] &&
               doc.attachInfo[md5].paths.length > 1) {
                dup++;
            }
        });
    }
    if (dup > 0 ) emit(dup,null);
}
