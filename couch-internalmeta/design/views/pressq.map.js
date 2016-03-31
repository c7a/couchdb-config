function(doc) {

    // Skip documents not approved
    if (!('approved' in doc)) {
        return;
    }

    // Skip if AIP has been copied to less than 4 repositories
    if (!('repos' in doc) || doc.repos.length < 4) {
        return;
    }

    // Grab the date Press last ran (if at all)
    var pressdate="";
    if (('press' in doc) 
        && ('date' in doc.press)) {
        pressdate=doc.press.date;
    }

    var queuedate=undefined;
    // We want to be able to find the oldest of the dates we find that
    // are more recent than the last time Press ran
    function uqd(testdate) {
        if (testdate > pressdate) {
            if ((queuedate == undefined) || (testdate < queuedate)) {
                queuedate = testdate;
            }
        }
    }

    // Look in attachments for updates
    if ('attachInfo' in doc) {
        if ('cmr.json' in doc.attachInfo) {
            uqd(doc.attachInfo["cmr.json"].uploadDate);
        } else {
            // Skip if cmr.json missing
            return;
        }
    }

    // If queuedate set then at least one date was newer than the last
    // time Press ran
    if (queuedate != undefined) emit(queuedate);
}
