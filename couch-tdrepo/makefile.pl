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

my $repoownmap = readjs("design/views/repoown.map.js");
my $newestaipmap = readjs("design/views/newestaip.map.js");
my $newestaipreduce = readjs("design/views/newestaip.reduce.js");
my $keyslist =  readjs("design/lists/keys.js");
my $newtomelist =  readjs("design/lists/newtome.js");
my $itemrepoupdate = readjs("design/updates/itemrepo.js");
my $manifestdatemap = readjs("design/views/manifestdate.map.js");
my $adddatemap = readjs("design/views/adddate.map.js");
my $itemdatekeylist =  readjs("design/lists/itemdatekey.js");
my $repofilesizemap = readjs("design/views/repofilesize.map.js");
my $replicatemap = readjs("design/views/replicate.map.js");
my $aipmd5map = readjs("design/views/aipmd5.map.js");
my $repopoolverifiedmap = readjs("design/views/repopoolverified.map.js");
my $manifestinfolist = readjs("design/lists/manifestinfo.js");


open FILE, ">tdr.js" or die "Couldn't open tdr.js: $!";
print FILE <<EOF;
exports.views = {
    "repoown": {
        "map": "${repoownmap}",
        "reduce": "_count"
    },
    "newestaip": {
        "map": "${newestaipmap}",
        "reduce": "${newestaipreduce}",
    },
    "manifestdate": {
	"map": "${manifestdatemap}",
	"reduce": "_count"
    },
    "adddate": {
	"map": "${adddatemap}",
        "reduce": "_count",
    },
    "repofilesize": {
	"map": "${repofilesizemap}",
	"reduce": "_stats",
    },
    "replicate": {
        "map": "${replicatemap}",
        "reduce": "_count",
    },
    "aipmd5": {
        "map": "${aipmd5map}",
        "reduce": "_count",
    },
    "repopoolverified": {
	"map": "${repopoolverifiedmap}",
	 "reduce": "_count",
    }
}
exports.lists = {
    "keys": "${keyslist}",
    "newtome": "${newtomelist}",
    "itemdatekey": "${itemdatekeylist}",
    "manifestinfo": "${manifestinfolist}"
}
exports.updates = {
     "itemrepo": "${itemrepoupdate}"
}

EOF
close FILE;
