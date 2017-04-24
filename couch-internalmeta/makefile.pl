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
use CIHM::TDR::REST::internalmeta;

##
## Modify this structure as new parts of design document authored.
##
my $design= {
    filters => {},
    lists => {},
    shows => {},
    updates => {
        basic => readjs("$FindBin::RealBin/design/updates/basic.js"),
        parent => readjs("$FindBin::RealBin/design/updates/parent.js"),
    },
    views => {
        aiphascmr => {
                map => readjs("$FindBin::RealBin/design/views/aiphascmr.map.js"),
                reduce => "_count",
        },
        doctype => {
            map => readjs("$FindBin::RealBin/design/views/doctype.map.js"),
            reduce => "_count",
        },
        pressq => {
            map => readjs("$FindBin::RealBin/design/views/pressq.map.js"),
            reduce => "_count",
        },
        presss => {
            map => readjs("$FindBin::RealBin/design/views/presss.map.js"),
            reduce => "_count",
        },
        issues => {
            map => readjs("$FindBin::RealBin/design/views/issues.map.js"),
            reduce => "_count",
        },
        haspubmin => {
            map => readjs("$FindBin::RealBin/design/views/haspubmin.map.js"),
            reduce => "_count",
        },
        coltitles => {
            map => readjs("$FindBin::RealBin/design/views/coltitles.map.js"),
            reduce => "_count",
        },
        metscount => {
            map => readjs("$FindBin::RealBin/design/views/metscount.map.js"),
            reduce => "_count",
        },
        nomets => {
            map => readjs("$FindBin::RealBin/design/views/nomets.map.js"),
            reduce => "_count",
        },
        metsdate => {
            map => readjs("$FindBin::RealBin/design/views/metsdate.map.js"),
        },
        metsdupmd5 => {
            map => readjs("$FindBin::RealBin/design/views/metsdupmd5.map.js"),
            reduce => "_count",
        },
        hammerq => {
            map => readjs("$FindBin::RealBin/design/views/hammerq.map.js"),
            reduce => "_count",
        },
        hammers => {
            map => readjs("$FindBin::RealBin/design/views/hammers.map.js"),
            reduce => "_count",
        },
        oddmets => {
            map => readjs("$FindBin::RealBin/design/views/oddmets.map.js"),
            reduce => "_count",
        },
        hasdimensionmatch => {
            map => readjs("$FindBin::RealBin/design/views/hasdimensionmatch.map.js"),
        },
        hasdimensionnomatch => {
            map => readjs("$FindBin::RealBin/design/views/hasdimensionnomatch.map.js"),
        },
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

my $internalmeta;
# Undefined if no <internalmeta> config block
if (exists $confighash{internalmeta}) {
    $internalmeta = new CIHM::TDR::REST::internalmeta (
        server => $confighash{internalmeta}{server},
        database => $confighash{internalmeta}{database},
        type   => 'application/json',
        conf   => $conf,
        clientattrs => {timeout => 3600}
        );
} else {
    croak "Missing <internalmeta> configuration block in config\n";
}



if($post) {
    my $revision;
    my $designdoc = "_design/tdr";
    $design->{"_id"}=$designdoc;

    my $res = $internalmeta->head("/".$internalmeta->database."/$designdoc",
                                    {},{deserializer => 'application/json'});
    if ($res->code == 200) {
        $revision=$res->response->header("etag");
        $revision =~ s/^\"|\"$//g;
        $design->{'_rev'} = $revision;
    }
    elsif ($res->code != 404) {
        croak "HEAD of $designdoc return code: ".$res->code."\n"; 
    }
    $res = $internalmeta->put("/".$internalmeta->database."/$designdoc",
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
