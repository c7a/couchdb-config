#!/usr/bin/env node

// $Header: $

var fs = require('graceful-fs');
var nano = require('nano');
var walk = require('walk');
var path = require('path');


// return the date in the given path, null if none
function getPathDate(filename) {

    var m = filename.match(/\S+\/revisions\/(\w+)(\.partial)?\/\S+/);
    if (m) {
        // Date doesn't parse dates of the form 20120217T135959
        // Months are off by one for some reason
        // Seconds need to be offset by one so that they don't clobber the
        //  current attachment
        return new Date( Date.UTC(
                    m[1].slice(0,4), m[1].slice(4,6) - 1, m[1].slice(6,8),
                    m[1].slice(9,11), m[1].slice(11,13), m[1].slice(13,15) - 1, 0 )
                ).toISOString();
    } else {
        return null;
    }

}

// stream a given file into an document attachment
function attachFile(tdrmets, filename, atchname, id, rev) {

    fs.createReadStream(filename).pipe(
        tdrmets.attachment.insert( id, atchname, null,
                'text/xml', {rev: rev}, function(err, resp) {
            if (err) return console.error(err);
            else console.log(resp);
    }));

}

// insert a document
function insertFile(tdrmets, filename, days) {

    // match for depositor and label and form the id
    var m = filename.match(/\S+\/\d\d\d\/(\w+)\.(\w+)\/\S+/);
    if (!m) return console.error('No id found in path.');
    var id = m[1] + '.' + m[2];

    fs.stat( filename, function(err, stats) {
        if (err) return console.error(err);

        var mtime = new Date(stats.mtime);
        var atchname = getPathDate(filename);
        if (!atchname) atchname = mtime.toISOString();

        // check if the file was modified within the given number of days
        if (days) {
            var today = new Date();
            var diff = (today - mtime) / (1000*60*60*24);
            console.log(diff,days);
            if (diff > days) return;
        }

        tdrmets.insert( {_id: id}, function(err, resp) {
            if (err) { 
                if (err.error === 'conflict') {
                    tdrmets.get(id, function(err, body) {
                        if (err) return console.error(err);
                        if (!body._attachments || !body._attachments[atchname]) {
                            attachFile(tdrmets, filename, atchname, id, body._rev);
                        }
                    });
                } else {
                    return console.error(err);
                }
            } else {
                attachFile(tdrmets, filename, atchname, id, resp.rev);
            }
        });
    });

}

// command line arguments
var cli = require('cli');
cli.parse({
    couch: ['c', 'couch database URL', 'string', 'http://localhost:5984/tdrmets'],
    limit: ['l', 'limit simultaneous couch connections', 'int', 7],
    root:  ['r', 'search path root', 'path'],
    days:  ['m', 'modified in last N days', 'int'],
});
cli.main(function(args, options) {

    // limit the number of couch connections
    var http = require('http');
    http.globalAgent.maxSockets = options.limit;

    // couch tdrmets database 
    var tdrmets = new nano(options.couch);

    if (options.root) {

        // walk the filesystem from the given root, looking for metadata files
        walk.walk( options.root, {
            // this makes assumptions about the tdrmets directory layout
            filters: ["incoming", "trashcan", "files"],
            listeners: {
                names: function (root, names) {
                    if (root.match(/\/data\//)) {
                        var i = names.indexOf('metadata.xml');
                        if (i >= 0) {
                            insertFile(tdrmets, path.join(root, names[i]), options.days);
                        }
                    }
                }
            }
        });

    } else {

        // loop over all metadata files given on the command line
        for (var filename of args) {
            insertFile(tdrmets, filename);
        }

    }

});
