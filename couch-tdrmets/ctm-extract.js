#!/usr/bin/env node

var nano = require('nano');
var sax = require('sax');

// get each row id, stream the latest attachment through a sax parser
function handleRow(tdrmets, id) {
    tdrmets.get( id, function (err, body) {
        if (err) return console.error(err);
        if (!body._attachments) return;

        // get the latest attachment name
        var atchname = Object.keys(body._attachments).sort().pop();

        var saxstrm = sax.createStream();
        saxstrm.on('opentag', function (node) {
        });
        saxstrm.on('attribute', function (attr) {
        });
        saxstrm.on('text', function (text) {
            if (( (this._parser.tag.name === 'SUBFIELD') ||
                    (this._parser.tag.name === 'SERIES') ||
                    (this._parser.tag.name === 'TITLE') ||
                    (this._parser.tag.name === 'SEQUENCE') ||
                    (this._parser.tag.name === 'LANGUAGE') ) &&
                    !text.match(/^\s+$/)) {
                console.log(this._parser.tag, text);
            }
        });
        saxstrm.on('closetag', function (name) {
            if (name === 'METS:XMLDATA') {
                this._parser.close();
            }
        });
        saxstrm.on('error', function (err) {
        });
        saxstrm.on('end', function () {
        });

        tdrmets.attachment.get(id, atchname).pipe(saxstrm);

    });
}

// command line arguments
var cli = require('cli');
cli.parse({
    couch: ['c', 'couch database URL', 'string', 'http://localhost:5984/tdrmets'],
    limit: ['l', 'limit simultaneous couch connections', 'int', 5],
});
cli.main(function(args, options) {

    // limit the number of couch connections
    var http = require('http');
    http.globalAgent.maxSockets = options.limit;

    // couch tdrmets database
    var tdrmets = new nano(options.couch);

    // loop over all documents
    tdrmets.list( function (err, body) {
        if (err) return console.error(err);
        for (var row of body.rows) {
            handleRow(tdrmets, row.id);
        }
    });

});
