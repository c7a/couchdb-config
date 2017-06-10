function(doc) {
    if ('canonicalDownload' in doc && doc.canonicalDownload.charAt(0) === "/") {
        emit(doc.canonicalDownload,null);
    }
}
