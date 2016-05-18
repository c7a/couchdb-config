function(doc, req){

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

    var nowdate = new Date();
    // Javascript toISOString() includes parts of a second, which we strip.
    var nowdates = nowdate.toISOString().replace(/\..*Z/,"Z");
    var updated=false;
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
            if (!(md5 in doc['_attachments'])) {
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
                if (md5 in doc['_attachments']) {
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
                doc['manifestdate']=updatedoc['manifestdate'];
                return [doc, '{"return": "attach match"}\n'];
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
