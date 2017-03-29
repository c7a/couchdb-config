function(doc) {
    if("status" in doc) {
        var idsp = doc["_id"].split(".");
        var dep=idsp.shift();
        var ext=idsp.pop();
        if (dep === "oocihm" && idsp[0].indexOf('lac_reel') === 0) {
            dep="oocihm.lac_reel";
        }
        emit([doc.status,doc.format,ext,dep],null);
    }
}
