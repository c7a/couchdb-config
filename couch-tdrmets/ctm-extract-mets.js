#!/usr/bin/env node

// $Header: http://svn.c7a.ca/svn/c7a/tdr/trunk/couch-tdrmets/ctm-extract-text.js 4833 2015-09-28 20:36:48Z darcy $

var nano = require('nano');
var sax = require('sax');

// get each row id, stream the latest attachment through a sax parser
function handleRow(tdrmets, id) {

    tdrmets.get( id, function (err, body) {
        if (err) return console.error(err);

        // get the latest attachment name
        if (!body._attachments) return;
        var atchname = Object.keys(body._attachments).sort().pop();

        // accumulate mets information
        var mets = {};

        // define the sax stream handlers
        var parser = sax.createStream();
        parser.on('text', function (text) {
            if (!text.trim()) return;
            if ( this._parser.tags.some( function (a) {
                    return (a.name === 'ISSUEINFO'); } ) ) {

                mets.mdtype = 'issueinfo';
                var tagname = this._parser.tag.name;
                switch (tagname) {
                    case 'COVERAGE':
                    case 'IDENTIFIER':
                    case 'LANGUAGE':
                    case 'NOTE':
                    case 'PUBLISHED':
                    case 'PUBSTATEMENT':
                    case 'SEQUENCE':
                    case 'SERIES':
                    case 'SOURCE':
                    case 'TITLE':
                        mets[tagname.toLowerCase()] = text;
                        break;
                    default:
                        break;
                }

            } else if ( this._parser.tags.some( function (a) {
                    return (a.name === 'SIMPLEDC'); } ) ) {

                mets.mdtype = 'dc';
                var tagname = this._parser.tag.name;
                switch (tagname) {
                    case 'DC:CONTRIBUTOR':
                    case 'DC:COVERAGE':
                    case 'DC:CREATOR':
                    case 'DC:DATE':
                    case 'DC:DESCRIPTION':
                    case 'DC:FORMAT':
                    case 'DC:IDENTIFIER':
                    case 'DC:LANGUAGE':
                    case 'DC:PUBLISHER':
                    case 'DC:RELATION':
                    case 'DC:RIGHTS':
                    case 'DC:SOURCE':
                    case 'DC:SUBJECT':
                    case 'DC:TITLE':
                    case 'DC:TYPE':
                        mets[tagname.slice(3).toLowerCase()] = text;
                        break;
                    default:
                        break;
                }

            } else if ( this._parser.tags.some( function (a) {
                    return (a.name === 'DATAFIELD'); } ) ) {

                mets.mdtype = 'marc';
                var popattrs = this._parser.tags.pop().attributes;
            	switch (popattrs.TAG) {
                    case '041':
                        mets.language = text;
                        break;
                    case '090':
                        mets.identifier = text;
                        break;
                    case '100':
                        mets.creator = text;
                        break;
                    case '110': case '111': case '130': case '245':
                    case '246': case '440': case '730': case '740':
                    case '830': case '840':
                        mets.title = text;
                        break;
                    case '250': case '362': case '500': case '504':
                    case '505': case '510': case '515': case '520':
                    case '534': case '546': case '580': case '787':
                    case '800': case '810': case '811':
                        mets.note = text;
                        break;
                    case '260':
                        mets.pubstatement = text;
                        break;
                    case '540':
                        mets.rights = text;
                        break;
                    case '600': case '610': case '630': case '650':
                    case '651':
                        mets.subject = text;
                        break;
                    case '700': case '710': case '711':
                        mets.creator = text;
                        break;
                    case '033':
                    case '035': case '040': case '043': case '300':
                    case '490': case '533': case '945': default:
                        // ignored
                        break;
                }

            }
        });
        parser.on('closetag', function (name) {
            if (name === 'METS:MDWRAP') {
            	if (Object.keys(mets).length) {
                    mets["source"] = id;
                    tdrmets.insert(mets, function(err, body) {
                        if (err) {
                            if (err.error !== 'conflict') console.error(err);
                        } else {
                            console.log(body);
                        }
                    });
                }
                mets = null;
                parser.end();
                parser.removeAllListeners();
            }
        });
        parser.on('error', function (err) {
            // handles the parser.end() above
        });
        parser.on('end', function () {
            // handles the parser.end() above
        });

        // stream the attachment to sax
        tdrmets.attachment.get(id, atchname).pipe(parser);

    });
}

// command line arguments
var cli = require('cli');
cli.parse({
    couch: ['c', 'couch database URL', 'string', 'http://localhost:5984/tdrmets'],
    limit: ['l', 'limit simultaneous couch connections', 'int', 7],
    docs:  ['d', 'METS documents to process', 'int', 10],
    start: ['s', 'METS document to start at', 'int', 0],
});
cli.main(function(args, options) {

    // limit the number of couch connections
    var http = require('http');
    http.globalAgent.maxSockets = options.limit;

    // couch tdrmets database
    var tdrmets = new nano(options.couch);

    // loop over documents
    tdrmets.view( 'attachments', 'counts',
                { skip: options.start, limit: options.docs,
                    reduce: false, startkey: 1 },
                function (err, body) {
        if (err) return console.error(err);
        for (var row of body.rows) {
            handleRow(tdrmets, row.id);
        }
    });

});

