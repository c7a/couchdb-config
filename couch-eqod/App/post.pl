#!/usr/bin/perl
# gets a specified document from a Couch DB


use 5.010;
use strict;
use warnings;
use utf8;
use JSON;
use FindBin;
use lib "$FindBin::Bin/../lib";
use CouchDB;

#my $database = shift(@ARGV);
my $document = shift(@ARGV);
my $attachment_id = shift (@ARGV);


my $db = CouchDB->new('127.0.0.1', '5984');
my $attachment = $db->put("eqod/$document/$attachment_id");
say $attachment;
