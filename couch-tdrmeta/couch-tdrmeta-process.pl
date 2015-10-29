#!/usr/bin/env perl

use strict;
use warnings;

# TODO: POD

use LWP::UserAgent;
use Getopt::Long;
use JSON;
use CARP;

my $tdrmeta = 'http://mini.office.c7a.ca:5984/tdrmeta';
my $co_search = 'http://mini.office.c7a.ca:5984/co_search';
my $skip = 0;
my $limit = 100;
GetOptions( 'tdrmeta=s' => \$tdrmeta,
            'co_search=s' => \$co_search,
            'skip=i' => \$skip,
            'limit=i' => \$limit )
    or croak 'Error in command line arguments.';

my $ua = LWP::UserAgent->new;
my $req = HTTP::Request->new( GET => $tdrmeta . 
            '/_design/attachments/_view/latest' .
            "?reduce=false&stale=ok&skip=$skip&limit=$limit" );
my $res = $ua->request($req);
if ($res->is_success) {

    my $list = from_json($res->content);

    foreach my $i ($skip .. $skip + $limit - 1) {

        $req = HTTP::Request->new( GET => $tdrmeta .
                    '/' . $list->{rows}[$i]->{id} .
                    '/' . $list->{rows}[$i]->{value} );
        $res = $ua->request($req);
        if ($res->is_success) {

            # TODO:
            # Do stuff with $res->content (XML)
            # Return $id and $content (JSON)
            my $id = 'aaa';
            my $content = '{"foo":"bar"}';

            $req = HTTP::Request->new(PUT => $co_search . '/' . $id);
            $req->header('Content-Type' => 'application/json');
            $req->content($content);
            $res = $ua->request($req);
    
            print $res->status_line, "\n"; # Just for feedback.

        } else {
            print $res->status_line, "\n"; # Error
        }
    }
} else {
    print $res->status_line, "\n"; # Error
}

