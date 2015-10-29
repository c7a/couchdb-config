#!/usr/bin/env perl

use strict;
use warnings;

# TODO:
# Create new docs
# Update publicReplicas
# Update updated
# POD 

use LWP::UserAgent;
use Getopt::Long;
use JSON;
use Carp;

my $tdrmeta = 'http://mini.office.c7a.ca:5984/tdrmeta';
my $tdrepo = 'http://beemster.office.c7a.ca:5984/tdrepo';
my $skip = 0;
my $limit = 100;
GetOptions( 'tdrmeta=s' => \$tdrmeta,
            'tdrepo=s' => \$tdrepo,
            'skip=i' => \$skip,
            'limit=i' => \$limit )
    or croak 'Error in command line arguments.';

my $ua = LWP::UserAgent->new;
my $req = HTTP::Request->new( GET => $tdrepo . 
            '/_design/tdr/_view/newestaip' .
            "?group_level=1&stale=ok&skip=$skip&limit=$limit" );
my $res = $ua->request($req);

if ($res->is_success) {

    my $list = from_json($res->content);

    foreach my $i (0 .. $limit - 1) {
        print to_json( { id => $list->{rows}[$i]->{key},
                updated => $list->{rows}[$i]->{value}[0],
                publicReplicas => $list->{rows}[$i]->{value}[1] } ), "\n";
    }

} else {
    print $res->status_line, "\n"; # Error
}

