function(doc) {
    var languages=['en','fr'];

    if ('isUpdate' in doc) {
        languages.forEach(function(lang) {
            if (lang in doc) {
                emit([lang,doc.created],doc[lang]);
            }
        });
    }
}