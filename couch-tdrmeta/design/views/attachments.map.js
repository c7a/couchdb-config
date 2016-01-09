function(doc) {
    var attach = 0;
    if ('_attachments' in doc) {
        attach = Object.keys(doc._attachments).length;
    }
    emit(attach,null);
}
