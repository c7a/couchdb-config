function(doc, req){

    var nowdate = new Date();
    // Javascript toISOString() includes parts of a second, which we strip.
    var nowdates = nowdate.toISOString().replace(/\..*Z/,"Z");
    var updated=false;

    function arrayeq (array1,array2) {
        // If same array, or both null, then equal
        if (array1 === array2)
            return true;

        // if eithor array is a falsy value, return
        if (!array1 || !array2)
            return false;

        // compare lengths - can save a lot of time
        if (array1.length != array2.length)
            return false;

        for (var i = 0, l=array1.length; i < l; i++) {
            if (array1[i] != array2[i]) {
                return false;
            }
        }
        return true;
    }

    if ('form' in req) {
        var updatedoc = req.form;

        if (!doc) {
            if ('id' in req && req['id']) {
                if ('nocreate' in updatedoc) {
                    return [null, '{"return": "no create"}\n'];
                } else {
                    // create new document
                    doc = {};
                    doc['_id'] = req['id'];
                    doc['created'] = nowdates;
                    updated=true;
                }
            } else {
                // change nothing in database
                return [null, '{"return": "Missing ID"}\n']
            }
        }
        // Field must exist
        if (!('attachInfo' in doc)) {
            doc['attachInfo'] = {};
            updated=true;
        }

        // Cleanup
        Object.keys(doc.attachInfo).forEach(function(md5) {
            if ('_attachments' in doc && !(md5 in doc['_attachments'])) {
                delete doc.attachInfo[md5];
                updated=true;
            }
        });
        
        if ('attachInfo' in updatedoc) {
            var attachInfo = JSON.parse(updatedoc['attachInfo']);
            var missing = [];
            var askedmd5 = {};
            Object.keys(attachInfo).forEach(function(md5) {
                var attach = attachInfo[md5];
                if ('_attachments' in doc && md5 in doc['_attachments']) {
                    if (md5 in doc.attachInfo) {
                        if(attach.pathDate !== doc.attachInfo[md5].pathDate) {
                            doc.attachInfo[md5].pathDate=attach.pathDate;
                            updated=true;
                        }
                        if(!arrayeq(attach.paths,doc.attachInfo[md5].paths)) {
                            doc.attachInfo[md5].paths=attach.paths;
                            updated=true;
                        }
                    } else {
                        doc.attachInfo[md5]=attach;
                        updated = true;
                    }
                } else if (!(md5 in askedmd5)) {
                    missing.push(attach['paths'].pop());
                }
            });
            var recentdate = "0";
            var recentmd5;
            Object.keys(doc.attachInfo).forEach(function(md5) {
                var attach=doc.attachInfo[md5];
                if ('fileDate' in attach && 'paths' in attach) {
                    for (var i = 0, l=attach.paths.length; i < l; i++) {
                        if (attach.paths[i].indexOf('data/sip/data') == 0 &&
                            attach.fileDate >= recentdate) {
                            recentdate=attach.fileDate;
                            recentmd5=md5;
                        }
                    }
                } else if ('uploadDate' in attach) {
                    if (attach.uploadDate > recentdate) {
                        recentdate=attach.uploadDate;
                        recentmd5=md5;
                    }
                }
            });
            if (recentdate > "0") {
                if (!('recentattach' in doc) ||
                    doc.recentattach.date != recentdate ||
                    doc.recentattach.md5 != recentmd5) {
                    doc.recentattach = {date:recentdate, md5:recentmd5};
                    updated=true;
                }
            } else {
                if ('recentattach' in doc) {
                    delete doc['recentattach'];
                    updated=true;
                }
            }
            if (missing.length > 0) {
                var myreturn= {
                    "return": "attach missing",
                    "missing": missing
                }
                if (updated) {
                    doc['updated'] = nowdates;
                    return [doc, JSON.stringify(myreturn)];
                } else {
                    return [null, JSON.stringify(myreturn)];
                }
            } else {
                if ('manifestdate' in updatedoc &&
                    (!('manifestdate' in doc) || 
                     doc['manifestdate'] !== updatedoc['manifestdate'])) {
                    doc['manifestdate']=updatedoc['manifestdate'];
                    updated=true;
                }
                if (updated) {
                    doc['updated'] = nowdates;
                    return [doc, '{"return": "attach match"}\n'];
                } else {
                    return [null, '{"return": "attach match"}\n'];
                }
            }
        } else if ('manifestdate' in updatedoc) {
            if (doc['manifestdate'] === updatedoc['manifestdate']) {
                return [null, '{"return": "date match"}'];
            }
        }        
    }
    if (updated) {
        doc['updated'] = nowdates;
        return [doc, '{"return": "update"}\n'];
    } else {
        return [null, '{"return": "no update"}\n'];
    }
}
