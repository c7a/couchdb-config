function(doc) {
    if ('press' in doc) {
        emit ([doc.press.status,doc.press.date],null);
    }
}
