function(doc) {
    for(var lang in doc) {
        if (Array.isArray(doc[lang].aliases)) {
            doc[lang].aliases.forEach(function(alias) {
                emit(alias,null);
            });
        }
    }
}
