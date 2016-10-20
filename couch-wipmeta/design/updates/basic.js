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

        // Ingest related fields
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

        // Export related fields
        if ('export' in updatedoc) {
            var export = JSON.parse(updatedoc['export']);
            if (!('date' in export)) {
                export['date'] = nowdates;
            }
            if(!'exportHistory' in doc || 
               !Array.isArray(doc['exportHistory'])) {
                doc['exportHistory']=[];
            }
            doc['exportHistory'].unshift(export);
            delete doc['exportReq'];
            updated=true;
        }
        if ('exportreq' in updatedoc) {
            var exportReq = JSON.parse(updatedoc['exportreq']);
            if (!('date' in exportReq)) {
                exportReq['date'] = nowdates;
            }
            doc['exportReq']=exportReq;
            updated=true;
        }
        if ('exporting' in updatedoc) {
            if ('exportReq' in doc) {
                doc.exportReq['exportdate'] = nowdates;
                updated=true;
             } else {
                return [null, '{"return": "no exportReq"}\n']
            }
        }

        // Generalized process request related fields
        if ('processreq' in updatedoc) {
            var processReq = JSON.parse(updatedoc.processreq);
            if (!('date' in processReq)) {
                processReq.date = nowdates;
            }
            if(!'processReq' in doc || 
               !Array.isArray(doc.processReq)) {
                doc.processReq=[];
            }
            doc.processReq.push(processReq);
            updated=true;
        }
        if ('processing' in updatedoc) {
            var ph = JSON.parse(updatedoc.processing);
            if (!('date' in ph)) {
                ph.date = nowdates;
            }
            if(!'processReq' in doc || 
               !Array.isArray(doc.processReq)) {
                return [null, '{"return": "no processReq"}\n']
            }
            if (!('reqdate' in ph) || 
                ph.reqdate !== doc.processReq[0].date) {
                return [null, '{"return": "No matching request date"}\n']
            }
            if (!('request' in ph) || 
                ph.request !== doc.processReq[0].request) {
                return [null, '{"return": "No matching request type"}\n']
            }
            if ('processhost' in doc.processReq[0]) {
                if (doc.processReq[0].processhost === ph.host) {
                    return [null, '{"return": "already set"}\n'];
                } else {
                    return [null, '{"return": "other host"}\n'];
                }
            } else {
                doc.processReq[0].processhost = ph.host;
                doc.processReq[0].processdate = ph.date;
                updated=true;
            }
        }
        if ('processed' in updatedoc) {
            var processed = JSON.parse(updatedoc['processed']);
            if (!('date' in processed)) {
                processed.date = nowdates;
            }
            if(!'processHistory' in doc || 
               !Array.isArray(doc.processHistory)) {
                doc.processHistory=[];
            }
            if(!'processReq' in doc || 
               !Array.isArray(doc.processReq)) {
                return [null, '{"return": "no processReq"}\n']
            }
            if (!('reqdate' in processed) || 
                processed.reqdate !== doc.processReq[0].date) {
                return [null, '{"return": "No matching request date"}\n']
            }
            if (!('request' in processed) || 
                processed.request !== doc.processReq[0].request) {
                return [null, '{"return": "No matching request type"}\n']
            }
            if (processed.status) {
                processed.req=[doc.processReq.shift()];
            } else {
                processed.req=doc.processReq;
                delete doc.processReq;
            }
            doc.processHistory.unshift(processed);
            updated=true;
        }

        // Manipulating Label (METS fragment)
        if ('label' in updatedoc) {
            doc.label=updatedoc.label;
            updated=true;
        }

        // Repository related fields
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
                doc['reposManifestDate']=updatedoc['manifestdate'];
                updated=true;
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
