#!/usr/bin/env perl

use strict;
use warnings;

# TODO:
# Create new docs
# Update publicReplicas
# Update updated
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
GetOptions( 'tdrmeta=s' => \$tdrmeta,
        'tdrepo=s' => \$tdrepo,
        'skip=i' => \$skip,
        'limit=i' => \$limit )
    or croak 'Error in command line arguments.';

my $ua = LWP::UserAgent->new(timeout => 8*60);

# GET a list of the AIP locations from tdrep
my $req = HTTP::Request->new( GET => $tdrepo . 
        '/_design/tdr/_view/newestaip' .
        '?group_level=1' .
        '&stale=ok' .
        ($skip ? "&skip=$skip" : '') .
        ($limit ? "&limit=$limit" : '') );
my $res = $ua->request($req);
if ($res->is_success) {

    my $list = from_json($res->content);

    foreach my $i (0 .. scalar @{$list->{rows}} - 1) {

        #print $list->{rows}[$i]->{key} . "\n";
        #print join(', ', @{$list->{rows}[$i]->{value}}) . "\n";
        #print join(', ', @{$list->{rows}[$i]->{value}[1]}) . "\n";

        # GET a document from tdrmeta
        $req = HTTP::Request->new( GET => $tdrmeta .
                '/' . $list->{rows}[$i]->{key} );
        $res = $ua->request($req);
        if ($res->is_success) {

            my $content = from_json($res->content);

            my ($s,$m,$h,$d,$o,$y) = (localtime)[0,1,2,3,4,5];
            print to_json( { _id => $content->{_id},
                    _rev => $content->{_rev},
                    updated => ($y+1900).'-'.($o+1).'-'.$d,
                    publicReplicas => $list->{rows}[$i]->{value}[1] } ), "\n";
 
            # PUT the updated document in tdrmeta
            #$req = HTTP::Request->new( GET => $tdrmeta .
            #'/' . $list->{rows}[$i]->{key} );
            #$req->header('Content-Type' => 'application/json');
            #$req->content($content);
            #$res = $ua->request($req);
    
            print $res->status_line, "\n"; # Feedback
 
        } else {
            print $res->status_line, "\n"; # Error
        }
    }
} else {
    print $res->status_line, "\n"; # Error
}

