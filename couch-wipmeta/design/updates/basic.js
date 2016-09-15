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
            delete doc['ingestReq'];
            updated=true;
        }
        if ('ingestreq' in updatedoc) {
            var ingestReq = JSON.parse(updatedoc['ingestreq']);
            if (!('date' in ingestReq)) {
                ingestReq['date'] = nowdates;
            }
            doc['ingestReq']=ingestReq;
            updated=true;
        }
        if ('processhost' in updatedoc) {
            var ph = updatedoc['processhost'];
            if ('ingestReq' in doc) {
                if ('processhost' in doc.ingestReq) {
                    if (doc.ingestReq.processhost === ph) {
                        return [null, '{"return": "already set"}\n'];
                    } else {
                        return [null, '{"return": "other host"}\n'];
                    }
                } else {
                    doc.ingestReq['processhost'] = ph;
                    doc.ingestReq['processdate'] = nowdates;
                    updated=true;
                }
            } else {
                return [null, '{"return": "no ingestReq"}\n']
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
