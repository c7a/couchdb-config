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

my $basicupdate = readjs("design/updates/basic.js");
my $attachmentsmap = readjs("design/views/attachments.map.js");
my $improcessmap = readjs("design/views/improcess.map.js");

open FILE, ">tdr.js" or die "Couldn't open tdr.js: $!";
print FILE <<EOF;
exports.views = {
    "attachments": {
        "map": "${attachmentsmap}",
        "reduce": "_count"
    },
    "improcess": {
        "map": "${improcessmap}",
        "reduce": "_count"
    },

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
    if (exists $confighash{tdrmeta}) {
        my $dburl = $confighash{tdrmeta}{server}."/".$confighash{tdrmeta}{database}."/";
        print "Pushing to $dburl\n";
        `/usr/bin/kanso push $dburl`;
    } else {
        croak "Missing <tdrmeta> configuration block in config\n";
    }
}
