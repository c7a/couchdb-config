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
use CIHM::TDR::REST::copresentation;

##
## Modify this structure as new parts of design document authored.
##
my $design= {
    filters => {},
    lists => {},
    shows => {},
    updates => {
        basic => readjs("$FindBin::RealBin/design/updates/basic.js"),
    },
    views => {
	coltitles => {
                map => readjs("$FindBin::RealBin/design/views/coltitles.map.js"),
                reduce => "_count",
        },
        colpages => {
                map => readjs("$FindBin::RealBin/design/views/colpages.map.js"),
                reduce => "_sum",
        },
        fileapproved => {
                map => readjs("$FindBin::RealBin/design/views/fileapproved.map.js"),
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

my $copresentation;
# Undefined if no <copresentation> config block
if (exists $confighash{copresentation}) {
    $copresentation = new CIHM::TDR::REST::copresentation (
        server => $confighash{copresentation}{server},
        database => $confighash{copresentation}{database},
        type   => 'application/json',
        conf   => $conf,
        clientattrs => {timeout => 3600}
        );
} else {
    croak "Missing <copresentation> configuration block in config\n";
}



if($post) {
    my $revision;
    my $designdoc = "_design/tdr";
    $design->{"_id"}=$designdoc;

    my $res = $copresentation->head("/".$copresentation->database."/$designdoc",
                                    {},{deserializer => 'application/json'});
    if ($res->code == 200) {
        $revision=$res->response->header("etag");
        $revision =~ s/^\"|\"$//g;
        $design->{'_rev'} = $revision;
    }
    elsif ($res->code != 404) {
        croak "HEAD of $designdoc return code: ".$res->code."\n"; 
    }
    $res = $copresentation->put("/".$copresentation->database."/$designdoc",
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
