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
        if ('repos' in updatedoc) {
            // This parameter sent as JSON encoded string
            var repos = JSON.parse(updatedoc['repos']);

            // Equality is same membership, even if different order
            function hasSameMembers(repo1,repo2) {
                if (!repo1 || !repo2 || repo1.length != repo2.length) {
                    return false;
                }
                // TODO: cheating for now - treat same if length same
                return true;
            }

            if (!hasSameMembers(doc['repos'],repos)) {
                doc['repos'] = repos;
                doc['type'] = 'aip';
                // Remove old key -- remove this once database transitioned
                delete doc['public_repo'];
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
        if (('parent' in updatedoc) && (doc['parent'] !== updatedoc['parent'])) {
            doc['parent'] = updatedoc['parent'];
            updated=true;
        }
        if ('pageinfo' in updatedoc) {
            // This parameter sent as JSON encoded string
            var pageinfo = JSON.parse(updatedoc['pageinfo']);

            doc['pageinfo'] = pageinfo;
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
        if ('collectionsadd' in updatedoc) {
            var col=[];
            if ('collections' in doc) {
                col=doc['collections'];
            }

            var cola = updatedoc['collectionsadd'].split(",");
            for (var i=0, l=cola.length; i<l; i++)
                if (col.indexOf(cola[i]) === -1 && cola[i] !== '')
                        col.push(cola[i]);
            doc['collections']=col;
            doc['collectionDate']=nowdates;
            updated=true;
        }
        if ('collectionssub' in updatedoc) {
            var col=[];
            if ('collections' in doc) {
                col=doc['collections'];
            }

            var cols = updatedoc['collectionssub'].split(",");
            var colnew = [];
            for (var i=0, l=col.length; i<l; i++)
                if (cols.indexOf(col[i]) === -1)
                    colnew.push(col[i]);
            doc['collections']=colnew;
            doc['collectionDate']=nowdates;
            updated=true;
        }
        if ('press' in updatedoc) {
            var press = JSON.parse(updatedoc['press']);
            if (!('date' in press)) {
                press['date'] = nowdates;
            }
            doc['press']=press;
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