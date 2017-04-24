function(doc) {
    if ('METSDate' in doc) {
        emit(doc.METSDate,null);
    }
}