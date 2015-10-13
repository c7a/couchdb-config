#!/usr/bin/perl
#parses eqod and uploads to couch

use 5.010;
use strict;
use warnings;

use FindBin;
use lib "$FindBin::Bin/../lib";
use CIHM::Eqod;

#call eqod module
#parse eqod csv file
#extract page (parent reel info) and tags
#create couch document for each page containing tags

my $eqod_doc = shift(@ARGV);

my ($fh, $csv);
my $eqod = CIHM::Eqod->new($eqod_doc);
my $reel = $eqod->reel($fh, $csv);
say $reel;

exit;