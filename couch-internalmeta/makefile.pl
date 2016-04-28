#!/usr/bin/env perl
use strict;
use Carp;
use warnings;
use Config::General;

sub readjs {
    my $filename = shift(@_);
    open FILE, $filename or die "Couldn't open $filename: $!"; 
    my $jsstring = join("", <FILE>); 
    close FILE;
    $jsstring =~ s/[\\]/\\\\/g;
    $jsstring =~ s/[\n]/\\n/g;
    $jsstring =~ s/[\"]/\\"/g;
    return $jsstring;
}

my $aiphascmrmap = readjs("design/views/aiphascmr.map.js");
my $doctypemap = readjs("design/views/doctype.map.js");
my $basicupdate = readjs("design/updates/basic.js");
my $pressqmap = readjs("design/views/pressq.map.js");
my $presssmap = readjs("design/views/presss.map.js");
my $issuesmap = readjs("design/views/issues.map.js");

open FILE, ">tdr.js" or die "Couldn't open tdr.js: $!";
print FILE <<EOF;
exports.views = {
	"aiphascmr": {
		"map": "${aiphascmrmap}",
		"reduce": "_count"
        },
	"doctype": {
		"map": "${doctypemap}",
		"reduce": "_count"
        },
	"pressq": {
        "map": "${pressqmap}",
        "reduce": "_count"
    },
    "presss": {
        "map": "${presssmap}",
        "reduce": "_count"
    },
    "issues": {
        "map": "${issuesmap}",
        "reduce": "_count"
    }
}
exports.lists = {
}
exports.updates = {
     "basic": "${basicupdate}"
}

EOF
close FILE;

my $arg = shift;
if ($arg && $arg eq "kanso") {
    my $conf = new Config::General (
        -ConfigFile => "/etc/canadiana/tdr/tdr.conf"
        );
    my %confighash = $conf->getall;
    if (exists $confighash{internalmeta}) {
        my $dburl = $confighash{internalmeta}{server}."/".$confighash{internalmeta}{database}."/";
        print "Pushing to $dburl\n";
        `/usr/bin/kanso push $dburl`;
    } else {
        croak "Missing <internalmeta> configuration block in config\n";
    }
}
