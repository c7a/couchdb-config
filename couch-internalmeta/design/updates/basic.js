function(doc, req){
    var nowdate = new Date();
    // Javascript toISOString() includes parts of a second, which we strip.
    var nowdates = nowdate.toISOString().replace(/\..*Z/,"Z");
    var updated=false;
    if (!doc) {
        if ('id' in req && req['id']) {
            // create new document
            doc = {};
            doc['_id'] = req['id'];
            doc['created'] = nowdates;
            updated=true;
        } else {
          // change nothing in database
          return [null, '{"error": "Missing ID"}\n']
        }
    }
    if ('form' in req) {
        var updatedoc = req.form;
        if ('public_repo' in updatedoc) {
            // This parameter sent as JSON encoded string
            doc['public_repo'] = JSON.parse(updatedoc['public_repo']);
            doc['type'] = 'aip';
            updated=true;
        }
        if ('type' in updatedoc) {
            doc['type'] = updatedoc['type'];
            updated=true;
        }
        if ('sub-type' in updatedoc) {
            doc['sub-type'] = updatedoc['sub-type'];
            updated=true;
        }
        if ('approved' in updatedoc) {
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
