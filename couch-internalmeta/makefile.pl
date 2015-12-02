#!/usr/bin/env perl
use strict;
use warnings;

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
