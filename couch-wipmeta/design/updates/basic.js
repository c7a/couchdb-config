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
        if ('ingest' in updatedoc) {
            var ingest = JSON.parse(updatedoc['ingest']);
            if (!('date' in ingest)) {
                ingest['date'] = nowdates;
            }

            if(!'ingestHistory' in doc || 
               !Array.isArray(doc['ingestHistory'])) {
                doc['ingestHistory']=[];
            }
            doc['ingestHistory'].unshift(ingest);
            updated=true;
        }
        if ('update' in updatedoc) {
            doc['updatereq'] = nowdates;
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
