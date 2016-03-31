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

open FILE, ">tdr.js" or die "Couldn't open tdr.js: $!";
print FILE <<EOF;
exports.views = {
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
    if (exists $confighash{cosearch}) {
        my $dburl = $confighash{cosearch}{server}."/".$confighash{cosearch}{database}."/";
        print "Pushing to $dburl\n";
        `/usr/bin/kanso push $dburl`;
    } else {
        croak "Missing <cosearch> configuration block in config\n";
    }
}
