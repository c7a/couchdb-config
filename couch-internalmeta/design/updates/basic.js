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
                // cheating for now
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
        if (('approved' in updatedoc) && (doc['approved'] !== updatedoc['approved'])) {
            doc['approved'] = updatedoc['approved'];
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