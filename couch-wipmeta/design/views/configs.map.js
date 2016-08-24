function(doc) {
    if ( doc['_id'].indexOf("_") != 0 && doc['_id'].indexOf('.') == -1) {
        emit (null,null);
    }
}
