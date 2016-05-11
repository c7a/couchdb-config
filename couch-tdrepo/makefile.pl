#!/usr/bin/env perl
use strict;
use warnings;
use Carp;

use lib "/opt/c7a-perl/current/cmd/local/lib/perl5";
use FindBin;
use lib "$FindBin::RealBin/../lib";

use Getopt::Long;
use JSON;
use CIHM::TDR::TDRConfig;
use CIHM::TDR::REST::tdrepo;

##
## Modify this structure as new parts of design document authored.
##
my $design= {
    filters => {},
    lists => {
        keys => readjs("$FindBin::RealBin/design/lists/keys.js"),
        newtome => readjs("$FindBin::RealBin/design/lists/newtome.js"),
        itemdatekey => readjs("$FindBin::RealBin/design/lists/itemdatekey.js"),
        manifestinfo => readjs("$FindBin::RealBin/design/lists/manifestinfo.js")
    },
    shows => {},
    updates => {
        itemrepo => readjs("$FindBin::RealBin/design/updates/itemrepo.js")
    },
    views => {
        repoown => {
            map => readjs("$FindBin::RealBin/design/views/repoown.map.js"),
            reduce => "_count",
        },
        newestaip => {
            map => readjs("$FindBin::RealBin/design/views/newestaip.map.js"),
            reduce => readjs("$FindBin::RealBin/design/views/newestaip.reduce.js"),
        },
        manifestdate => {
            map =>  readjs("$FindBin::RealBin/design/views/manifestdate.map.js"),
            reduce => "_count",
        },
        adddate => {
            map => readjs("$FindBin::RealBin/design/views/adddate.map.js"),
            reduce => "_count",
        },
        repofilesize => {
            map => readjs("$FindBin::RealBin/design/views/repofilesize.map.js"),
            reduce => "_stats",
        },
        replicate => {
            map => readjs("$FindBin::RealBin/design/views/replicate.map.js"),
            reduce => "_count",
        },
        aipmd5 => {
            map => readjs("$FindBin::RealBin/design/views/aipmd5.map.js"),
            reduce => "_count",
        },
        repopoolverified => {
            map => readjs("$FindBin::RealBin/design/views/repopoolverified.map.js"),
            reduce => "_count",
        }
    }
};

## Everything else should just work without being fiddled with.

my $conf = "/etc/canadiana/tdr/tdr.conf";
my $post;

GetOptions (
    'conf:s' => \$conf,
    'post' => \$post,
    );

my $config = CIHM::TDR::TDRConfig->instance($conf);
croak "Can't parse $conf\n" if (!$config);

my %confighash = %{$config->get_conf};

my $tdrepo;
# Undefined if no <tdrepo> config block
if (exists $confighash{tdrepo}) {
    $tdrepo = new CIHM::TDR::REST::tdrepo (
        server => $confighash{tdrepo}{server},
        database => $confighash{tdrepo}{database},
        type   => 'application/json',
        conf   => $conf,
        clientattrs => {timeout => 3600}
        );
} else {
    croak "Missing <tdrepo> configuration block in config\n";
}



if($post) {
    my $revision;
    my $designdoc = "_design/tdr";
    $design->{"_id"}=$designdoc;

    my $res = $tdrepo->head("/".$tdrepo->database."/$designdoc",
                                    {},{deserializer => 'application/json'});
    if ($res->code == 200) {
        $revision=$res->response->header("etag");
        $revision =~ s/^\"|\"$//g;
        $design->{'_rev'} = $revision;
    }
    elsif ($res->code != 404) {
        croak "HEAD of $designdoc return code: ".$res->code."\n"; 
    }
    $res = $tdrepo->put("/".$tdrepo->database."/$designdoc",
                                $design, {deserializer => 'application/json'});
    if ($res->code != 201) {
        croak "PUT of $designdoc return code: ".$res->code."\n"; 
}
} else {
    print "with --post would post:\n" .
        to_json( $design, { ascii => 1, pretty => 1 } ) . "\n";
}


sub readjs {
    my $filename = shift(@_);
    open FILE, $filename or die "Couldn't open $filename: $!"; 
    my $jsstring = join("", <FILE>); 
    close FILE;
    return $jsstring;
}
