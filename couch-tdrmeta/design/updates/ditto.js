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
                return [null, '{"error": "Missing ID"}\n']
            }
        }
        if ('manifestdate' in updatedoc) {
            if (doc['manifestdate'] === updatedoc['manifestdate']) {
                return [null, '{"return": "date match"}'];
            }
        }
        if ('attachInfo' in updatedoc) {
            var attachInfo = JSON.parse(updatedoc['attachInfo']);
            doc['attachInfo']=attachInfo;
            doc['manifestdate']=updatedoc['manifestdate'];
            updated=true;
        }
        
    }
    if (updated) {
        doc['updated'] = nowdates;
        return [doc, '{"return": "update"}\n'];
    } else {
        return [null, '{"return": "no update"}\n'];
    }
}
