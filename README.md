# couchdb-config
Couchdb configuration, documentation, and design documents.

Our platform makes extensive use of CouchDB, which reliably replicates databases across the multiple data centers that we run our application.  Each database has its own configuration, primarily in the form of a design document which is posted to that database.

# History

This source was moved from a Subversion repository, using the following git-svn command:

    git svn clone file:///data/svn/c7a -T tdr/trunk --include-paths="^tdr\/trunk\/couch-.*" --authors-file=/home/git/authors.txt --no-metadata -s couchdb-config

 The CouchDB design documents were part of the 'tdr' project, which has a long history.  Much of the Perl modules that have since been split into separate modules started in tdr/trunk/lib/ .
 
 While the filter means the only file changes kept are CouchDB related, the history indicates descriptions of commits going back to the first commit to the 'tdr' project by [William Wueppelmann back in January 2011](https://github.com/c7a/couchdb-config/commits/master?after=b83f7694be1e652dfbfe9ecf4c2911fb774d9c4d+1539)
