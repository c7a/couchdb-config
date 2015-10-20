#!/usr/bin/env node

// $Header$

var nano = require('nano');
var sax = require('sax');

// create an array, push data if not there
function pusharr(arr, data) {
    if (!arr) arr = [];
    if (arr.indexOf(data) < 0) arr.push(data);
    return arr;
}

// get each row id, stream the latest attachment through a sax parser
function handleRow(tdrmets, cosearch, id) {

    tdrmets.get( id, (err, body) => {
        if (err) return console.error(err);

        // get the latest attachment name
        if (!body._attachments) return;
        var atchname = Object.keys(body._attachments).sort().pop();

        // accumulate mets data and page text and labels
        var mets = {};
        var pagetext;

        // define sax stream handlers
 
        var parser = sax.createStream({trim: true, normalize: true});

        parser.on( 'opentag', node => {
            switch (node.name) {
                case 'page':
                    pagetext = [];
                    break;
                case 'mets:div':
                    if (node.attributes.TYPE === 'page') {
                        if (!mets.labels) mets.labels = [];
                        mets.labels.push(node.attributes.LABEL);
                    }
                    break;
                default:
                    break;
            }
        });

        parser.on( 'text', function (text) {
            if (!text.trim()) return;
            if (this._parser.tags.some(a => (a.name === 'issueinfo'))) {
                mets.mdsource = id;
                mets.mdtype = 'issueinfo';
                var tagname = this._parser.tag.name;
                var tagnew = tagname;
                switch (tagname) {
                    case 'identifier': case 'language': case 'note':
                    case 'pubstatement': case 'source': case 'title':
                        mets[tagnew] = pusharr(mets[tagnew], text);
                        break;
                    case 'coverage':
                        tagnew = 'note';
                        mets[tagnew] = pusharr(mets[tagnew], text);
                        break;
                    case 'published':
                        tagnew = 'date';
                        mets[tagnew] = pusharr(mets[tagnew], text);
                        break;
                    case 'sequence': case 'series':
                    default:
                        break;
                }

            } else if (this._parser.tags.some(a => (a.name === 'simpledc'))) {
                mets.mdsource = id;
                mets.mdtype = 'dublincore';
                var tagname = this._parser.tag.name;
                var tagnew = tagname.slice(3);
                switch (tagname) {
                    case 'dc:creator': case 'dc:date': case 'dc:description':
                    case 'dc:identifier': case 'dc:language': case 'dc:rights':
                    case 'dc:source': case 'dc:subject': case 'dc:title':
                        mets[tagnew] = pusharr(mets[tagnew], text);
                        break;
                    case 'dc:contributor':
                        tagnew = 'source';
                        mets[tagnew] = pusharr(mets[tagnew], text);
                        break;
                    case 'dc:publisher':
                        tagnew = 'pubstatement';
                        mets[tagnew] = pusharr(mets[tagnew], text);
                        break;
                    case 'dc:coverage': case 'dc:relation': case 'dc:type':
                        tagnew = 'note';
                        mets[tagnew] = pusharr(mets[tagnew], text);
                        break;
                    case 'dc:format':
                    default:
                        break;
                }

            } else if (this._parser.tags.some(a => (a.name === 'datafield'))) {
                mets.mdsource = id;
                mets.mdtype = 'marc21';
 
            	var tagname = this._parser.tags.pop().attributes.tag;
                var tagnew = tagname;
            	switch (tagname) {
                    case '041':
                        tagnew = 'language';
                        mets[tagnew] = pusharr(mets[tagnew], text);
                        break;
                    case '090':
                        tagnew = 'identifier';
                        mets[tagnew] = pusharr(mets[tagnew], text);
                        break;
                    case '100':
                        tagnew = 'creator';
                        mets[tagnew] = pusharr(mets[tagnew], text);
                        break;
                    case '110': case '111': case '130': case '245':
                    case '246': case '440': case '730': case '740':
                    case '830': case '840':
                        tagnew = 'title';
                        mets[tagnew] = pusharr(mets[tagnew], text);
                        break;
                    case '250': case '362': case '500': case '504':
                    case '505': case '510': case '515': case '520':
                    case '534': case '546': case '580': case '787':
                    case '800': case '810': case '811':
                        tagnew = 'note';
                        mets[tagnew] = pusharr(mets[tagnew], text);
                        break;
                    case '260':
                        tagnew = 'pubstatement';
                        mets[tagnew] = pusharr(mets[tagnew], text);
                        break;
                    case '540':
                        tagnew = 'rights';
                        mets[tagnew] = pusharr(mets[tagnew], text);
                        break;
                    case '600': case '610': case '630': case '650':
                    case '651':
                        tagnew = 'subject';
                        mets[tagnew] = pusharr(mets[tagnew], text);
                        break;
                    case '700': case '710': case '711':
                        tagnew = 'creator';
                        mets[tagnew] = pusharr(mets[tagnew], text);
                        break;
                    case '033': case '035': case '040': case '043':
                    case '300': case '490': case '533': case '945':
                    default:
                        break;
                }

            } else if (pagetext) {
                pagetext.push(text);
            }
        });

        parser.on( 'closetag', name => {
            switch (name) {

                case 'mets:mdWrap':
                    if (mets) { 
                        mets._id = mets.mdsource;

                        // language code normalization
                        for (i in mets.language) {
                            if (mets.language[i].length % 3 == 0) {
                                mets.language[i] = mets.language[i].match(/.{1,3}/g);
                            } else {
                                mets.language[i] = 'err';
                            }
                        }
                        if (mets.language && (mets.language.length > 0)) {
                            mets.language = mets.language
                                .reduce((a,b) => {return a.concat(b);})
                                .map((a) => {return a.toLowerCase();})
                                .map((a) => {return (a === 'fre') ? 'fra' : a;})
                                .map((a) => {return (a === 'ang') ? 'eng' : a;})
                                .sort()
                                .filter((v, i, a) => {return (v === a[i-1]) ? 0 : 1;});
                        }

                        // date code normalization
                        if (mets.date) {
                            var min = mets.date[0]
                                    .split(/-/)
                                    .map((a) => {return parseInt(a)});
                            if (min.length == 1) min.push(1, 1);
                            else if (min.length == 2) min.push(1);
                            mets.date[0] = new Date(min[0], min[1]-1, min[2])
                                    .toJSON()
                                    .split(/T/)[0];
                            if (mets.date[1]) {
                                var max = mets
                                    .date[1]
                                    .split(/-/)
                                    .map((a) => {return parseInt(a)});
                                if (max.length == 1) max.push(12, 31);
                                else if (max.length == 2) {max[1]++; max.push(0);}
                                mets.date[1] = new Date(max[0], max[1]-1, max[2])
                                    .toJSON()
                                    .split(/T/)[0];
                            }
                        }
                    }
                    break;

                case 'page':
                    if (!mets.pages) mets.pages = [];
                    mets.pages.push(pagetext.join(' '));
                    pagetext = null;
                    break;

                default:
                    break;
            }
        });


        parser.on( 'error', function (err) {
            // ignore parsing errors
        });

        parser.on( 'end', function () {
            cosearch.insert( mets, (err, body) => {
                if (err && (err.error !== 'conflict')) {
                    console.error(err);
                } else if (!err) {
                    console.log(body);
                }
            });
        });

        // stream the attachment through the sax parser
        tdrmets.attachment.get(id, atchname).pipe(parser);

    });
}

var cli = require('cli');
cli.parse({

    // command line arguments
    tdrmets:  ['t', 'tdrmets database URL', 'string', 'http://localhost:5984/tdrmets'],
    cosearch: ['c', 'cosearch database URL', 'string', 'http://localhost:5984/cosearch'],
    limit:    ['l', 'limit simultaneous couch connections', 'int', 7],
    docs:  ['d', 'METS documents to process', 'int', 10],
    start: ['s', 'METS document to start at', 'int', 0],

});
cli.main(function(args, options) {

    // limit the number of couch connections
    var http = require('http');
    http.globalAgent.maxSockets = options.limit;

    // couch databases
    var tdrmets = new nano(options.tdrmets);
    var cosearch = new nano(options.cosearch);

    // loop over documents
    tdrmets.view( 'attachments', 'dates_latest',
                { skip: options.start, limit: options.docs, reduce: false },
                (err, body) => {
        if (err) return console.error(err);

        for (var row of body.rows) {
            handleRow(tdrmets, cosearch, row.id);
        }

    });

});

