#!/usr/bin/perl

use LWP::UserAgent;
use JSON;
use Getopt::Long;

my $tdrmeta = 'http://mini.office.c7a.ca:5984/tdrmeta';
my $skip = 0;
my $limit = 100;
GetOptions( 'tdrmeta=s' => \$tdrmeta,
            'skip=i'    => \$skip,
            'limit=i'   => \$limit)
    or die 'Error in command line arguments.';

my $ua = LWP::UserAgent->new;

my $req = HTTP::Request->new( GET => $tdrmeta . 
        '/_design/attachments/_view/latest' .
        "?reduce=false&stale=ok&skip=$skip&limit=$limit" );
my $res = $ua->request($req);

if ($res->is_success) {
    my $list = from_json($res->content);

    foreach my $i (0..$limit-1) {
        print "$list->{rows}[$i]->{id}\n";
        $req = HTTP::Request->new( GET => $tdrmeta .
                '/' . $list->{rows}[$i]->{id} .
                '/' . $list->{rows}[$i]->{value});
        $res = $ua->request($req);

        print $res->content;

    }

} else {
    print $res->status_line, "\n";
}

