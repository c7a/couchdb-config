#!/usr/bin/perl

use LWP::UserAgent;
use JSON;

my $ua = LWP::UserAgent->new;

my $req = HTTP::Request->new(GET =>
    'http://mini.office.c7a.ca:5984/tdrmeta/_design/attachments/_view/latest' .
    '?reduce=false&stale=ok');
my $res = $ua->request($req);

if ($res->is_success) {
    my $list = from_json($res->content);

    my $nrows = $list->{'total_rows'};
    foreach my $i (0..$nrows) {
        $req = HTTP::Request->new(GET =>
            'http://mini.office.c7a.ca:5984/tdrmeta/' .
            $list->{'rows'}[$i]->{'id'} . "/" . $list->{'rows'}[$i]->{'value'});
        $res = $ua->request($req);

        print $res->content;

    }

} else {
    print $res->status_line, "\n";
}

