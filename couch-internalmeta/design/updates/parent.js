function(doc, req){
    if (!doc) {
        // Parents must already exist
        return [null, '{"return": "not found"}\n']
    }

    var nowdate = new Date();
    // Javascript toISOString() includes parts of a second, which we strip.
    var nowdates = nowdate.toISOString().replace(/\..*Z/,"Z");
    doc['updatereq'] = nowdates;
    doc['updated'] = nowdates;

    var thisreturn = {
        "label": doc["label"],
        "return": "updated"
    }
    return [doc, JSON.stringify(thisreturn)];
}