#!/usr/bin/perl
# gets a specified document from a Couch DB


use 5.010;
use strict;
use warnings;
use utf8;
use JSON;
use CouchDB;

#my $database = shift(@ARGV);
my $document = shift(@ARGV);
my $attachment_id = shift (@ARGV);


my $db = CouchDB->new('192.168.1.25', '5984');
my $attachment = $db->get("mallet/$document/$attachment_id");
say $attachment;

#output to JSON
#my $json = JSON->new->utf8(1)->pretty(1)->encode($data);
open my $fh, ">", "$attachment_id";
print $fh $attachment;
print "$attachment\n";