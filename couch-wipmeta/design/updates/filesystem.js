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
                return [null, '{"return": "Missing ID"}\n']
            }
        }
        if ('classify' in updatedoc) {
            var classify=JSON.parse(updatedoc['classify']);
            if (Object.keys(classify).length >0) {
                if ('classify' in doc) {
                    function hasSameClassify(nclassify,oclassify) {
                        var nkeys=Object.keys(nclassify);
                        var okeys=Object.keys(oclassify);
                        if (nkeys.length != okeys.length) {
                            return false;
                        }
                        if (! (nkeys.every(function(thiskey) {
                            return (thiskey in oclassify && 
                                    nclassify[thiskey] === oclassify[thiskey]);
                        }))) {
                            return false;
                        }
                        return true;
                    }
                    if (! hasSameClassify(classify,doc.classify)) {
                        doc['classify']=classify;
                        updated=true;
                    }
                } else {
                    doc['classify']=classify;
                    updated=true;
                }
            }
        }
        if ('filesystem' in updatedoc) {
            // This parameter sent as JSON encoded string
            var filesystem = JSON.parse(updatedoc['filesystem']);
            var oldvalues = {};
            if (!('filesystem' in doc)) {
                doc.filesystem = {};
            }
            if ('stage' in filesystem &&
                (doc.filesystem.stage !== filesystem.stage ||
                 doc.filesystem.stage === '')) {
                oldvalues.stage = doc.filesystem.stage;
                doc.filesystem.stage = filesystem.stage;
                if (doc.filesystem.stage === '') {
                    delete doc.filesystem.stage;
                }
                updated=true;
            }
            if ('configid' in filesystem &&
                doc.filesystem.configid !== filesystem.configid) {
                oldvalues.configid = doc.filesystem.configid;
                doc.filesystem.configid = filesystem.configid;
                updated=true;
            }
            if ('identifier' in filesystem &&
                doc.filesystem.identifier !== filesystem.identifier) {
                oldvalues.identifier = doc.filesystem.identifier;
                doc.filesystem.identifier = filesystem.identifier;
                updated=true;
            }
            if (updated) {
                if (! ('foundDate' in doc.filesystem)) {
                    doc.filesystem.foundDate = nowdates;
                }
                doc.filesystem.moveDate = nowdates;
                doc.updated = nowdates;
                oldvalues['return'] = 'update'; 
                return [doc, JSON.stringify(oldvalues)];
            }
        } else if (updated) {
            doc.updated = nowdates;
            return [doc, '{"return": "update"}\n'];
        }
    }
    return [null, '{"return": "no update"}\n'];
}
