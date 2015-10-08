#!/usr/bin/env node

// $Header$

var nano = require('nano');
var expat = require('node-expat');

// get each row id, stream the latest attachment through a sax parser
function handleRow(tdrmets, id) {

    tdrmets.get( id, function (err, body) {
        if (err) return console.error(err);
        if (!body._attachments) return;

        // get the latest attachment name
        var atchname = Object.keys(body._attachments).sort().pop();

        // accumulate page data
        var page_id;
        var page;

        // define the sax stream handlers
        var parser = expat.createParser();
        parser.on('startElement', function(name, attrs) {
            if (name === 'mets:dmdSec') {
                page_id = id + '.' + attrs.ID.split('.').pop();
            } else if (name === 'page') {
                page = {_id: page_id, mdsource: id, mdtype: 'txtmap', text: []};
            }
        });
        parser.on('text', function(text) {
            if (page && text.trim()) {
                page.text.push(text.trim());
            }
        });
        parser.on('endElement', function (name) {
            if (name === 'page') {
                page.text = page.text.join(' ');
                tdrmets.insert(page, function(err, body) {
                    if (err) {
                        // don't replace data ?
                        if (err.error !== 'conflict') console.error(err);
                    } else {
                        console.log(body);
                    }
                });
                page = null;
            }
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

