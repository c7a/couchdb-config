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
        if ('public_repo' in updatedoc) {
            // This parameter sent as JSON encoded string
            var pubrepo = JSON.parse(updatedoc['public_repo']);

            // Equality is same membership, even if different order
            function hasSameMembers(repo1,repo2) {
                if (!repo1 || !repo2 || repo1.length != repo2.length) {
                    return false;
                }
                // TODO: cheating for now - treat same if length same
                return true;
            }

            if (!hasSameMembers(doc['public_repo'],pubrepo)) {
                doc['public_repo'] = pubrepo;
                doc['type'] = 'aip';
                updated=true;
            }
        }
        if (('type' in updatedoc) && (doc['type']!== updatedoc['type'])) {
            doc['type'] = updatedoc['type'];
            updated=true;
        }
        if (('sub-type' in updatedoc) && (doc['sub-type'] !== updatedoc['sub-type'])) {
            doc['sub-type'] = updatedoc['sub-type'];
            updated=true;
        }
        if ('approved' in updatedoc) {
            if(updatedoc['approved'] === 'false') {
                if('approved' in doc) {
                    delete doc['approved'];
                    updated=true;
                }
            } else {
                if(!('approved' in doc)) {
                    doc['approved'] = nowdates;
                    updated=true;
                }
            }
        }
        if ('upload' in updatedoc) {
            var uploadinfo = {};
            if ('uploadinfo' in updatedoc) {
                // This parameter sent as JSON encoded string
                var uploadinfo = JSON.parse(updatedoc['uploadinfo']);
            }
            uploadinfo["uploadDate"] = nowdates;
            
            var attachinfo = {};
            if ('attachInfo' in doc) {
                attachinfo = doc['attachInfo'];
            }
            attachinfo[updatedoc['upload']]=uploadinfo;

            doc['attachInfo']=attachinfo;
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