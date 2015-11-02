#!/usr/bin/env perl

use strict;
use warnings;

# TODO:
# Bulk udpates
# Add POD 

use LWP::UserAgent;
use Getopt::Long;
use DateTime;
use JSON;
use Carp;

my $tdrmeta = 'http://mini.office.c7a.ca:5984/tdrmeta';
my $tdrepo = 'http://beemster.office.c7a.ca:5984/tdrepo';
my $skip = 0;
my $limit = 0;
GetOptions(
        'tdrmeta=s' => \$tdrmeta,
        'tdrepo=s' => \$tdrepo,
        'skip=i' => \$skip,
        'limit=i' => \$limit )
    or croak 'Error in command line arguments.';

my $ua = LWP::UserAgent->new(timeout => 8*60);

# GET a list of the AIP locations from tdrepo
my $req = HTTP::Request->new( GET => $tdrepo . 
        '/_design/tdr/_view/newestaip' .
        '?group_level=1' . '&stale=ok' .
        ($skip ? "&skip=$skip" : '') .
        ($limit ? "&limit=$limit" : '') );
my $res = $ua->request($req);
if ($res->is_success) {

    my $list = from_json($res->content);
    foreach my $i (0 .. scalar @{$list->{rows}} - 1) {

        my $id = $list->{rows}[$i]->{key};
        my $replicas = $list->{rows}[$i]->{value}[1];

        # GET a document from tdrmeta
        $req = HTTP::Request->new(GET => $tdrmeta . '/' . $id);
        $res = $ua->request($req);
        if ($res->is_success) {

            my $content = from_json($res->content);
            next if ( $content->{publicReplicas} &&
                    ($content->{publicReplicas} ~~ $replicas) );

            my $update = to_json( {
                    _rev => $content->{_rev},
                    updated => DateTime->now->datetime,
                    publicReplicas => $replicas } );
 
            # PUT the updated document in tdrmeta
            $req = HTTP::Request->new(PUT => $tdrmeta . '/' . $id);
            $req->header('Content-Type' => 'application/json');
            $req->content($update);
            $res = $ua->request($req);
    
            print $res->status_line, " ", $id, "\n"; # Feedback
 
        } else {
            print $res->status_line, " ", $id, "\n"; # Error
        }
    }
} else {
    print $res->status_line, "\n"; # Error
}

