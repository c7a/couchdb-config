function(doc) {
    if ('press' in doc) {
        emit ([doc.press.status,doc.press.message !== "",doc.press.date],null);
    }
}
