function(doc, req){
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
        if ('manifestdate' in updatedoc) {
            if (doc['manifestdate'] === updatedoc['manifestdate']) {
                return [null, '{"return": "date match"}'];
            }
        }
        if ('attachInfo' in updatedoc) {
            var attachInfo = JSON.parse(updatedoc['attachInfo']);
            var missing = [];
            attachInfo.forEach(function(attach) {
                var amatch=false;
                Object.keys(doc.attachInfo).some(function(infokey) {
                    if (attach.md5 === doc.attachInfo[infokey].md5) {
                        amatch=true;
                        if (attach.path !== doc.attachInfo[infokey].path) {
                            doc.attachInfo[infokey].path=attach.path;
                            updated=true;
                        }
                        return true;
                    }
                    return false;
                });
                if (!amatch) {
                    missing.push(attach.path);
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
        }
        
    }
    if (updated) {
        doc['updated'] = nowdates;
        return [doc, '{"return": "update"}\n'];
    } else {
        return [null, '{"return": "no update"}\n'];
    }
}
