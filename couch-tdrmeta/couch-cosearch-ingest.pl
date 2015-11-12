#!/usr/bin/env perl

use strict;
use warnings;

use Carp;
use Getopt::Long;
use LWP::UserAgent;
use File::Find;
use XML::LibXML;
use JSON;

my $cosearch = 'http://mini.office.c7a.ca:5984/cosearch';
my $root = '.';
GetOptions(
    'cosearch=s' => \$cosearch,
    'root=s' => \$root,
) or croak 'Error in command line arguments.';
my $ua = LWP::UserAgent->new(timeout => 8*60);

find(\&wanted, $root);
sub wanted {
    if (-f && /^cmr\.xml\z/s) {
        my $cmr = XML::LibXML->load_xml(location => $File::Find::name);
        my $result = {};
        $result->{_id} =
            $cmr->find('(//cmr:key)[1]')->string_value();
        if ($cmr->find('(//cmr:pkey)[1]')) {
            $result->{pkey} =
                $cmr->find('(//cmr:pkey)[1]')->string_value();
        }
        $result->{contributor} =
            $cmr->find('(//cmr:contributor)[1]')->string_value();
        $result->{type} =
            $cmr->find('//cmr:type/text()')->to_literal_list();
        $result->{key} =
            $cmr->find('//cmr:key/text()')->to_literal_list();
        $result->{label} =
            $cmr->find('//cmr:label/text()')->to_literal_list();
        if ($cmr->find('//cmr:seq/text()')) {
            $result->{seq} = $cmr->find('//cmr:seq/text()')->to_literal_list();
        }
        if ($cmr->find('//cmr:pubdate')) {
            $result->{pubdate} =
                [ $cmr->find('//cmr:pubdate/@min')->string_value(),
                    $cmr->find('//cmr:pubdate/@max')->string_value() ];
        }
        if ($cmr->find('//cmr:lang')) {
            $result->{lang} =
                $cmr->find('//cmr:lang')->to_literal_list();
        }
        if ($cmr->find('//cmr:media')) {
            $result->{media} =
                $cmr->find('//cmr:media')->to_literal_list();
        }
        if ($cmr->find('//cmr:title')) {
            $result->{title} =
                $cmr->find('//cmr:title')->to_literal_list();
        }
        # TODO doesn't make sense as a seperate array
        if ($cmr->find('//cmr:title/@type')) {
            $result->{title_type} =
                $cmr->find('//cmr:title/@type')->to_literal_list();
        }
        if ($cmr->find('//cmr:author')) {
            $result->{author} =
                $cmr->find('//cmr:author')->to_literal_list();
        }
        if ($cmr->find('//cmr:publication')) {
            $result->{publication} =
                $cmr->find('//cmr:publication')->to_literal_list();
        }
        if ($cmr->find('//cmr:subject')) {
            $result->{subject} =
                $cmr->find('//cmr:subject')->to_literal_list();
        }
        # TODO does this make sense as a seperate array
        if ($cmr->find('//cmr:subject/@lang')) {
            $result->{subject_lang} =
                $cmr->find('//cmr:subject/@lang')->to_literal_list();
        }
        if ($cmr->find('//cmr:note')) {
            $result->{note} =
                $cmr->find('//cmr:note')->to_literal_list();
        }
        # TODO doesn't make sense as a seperate array
        if ($cmr->find('//cmr:note/@type')) {
            $result->{note_type} =
                $cmr->find('//cmr:note/@type')->to_literal_list();
        }
        if ($cmr->find('//cmr:text')) {
            $result->{text} =
                $cmr->find('//cmr:text')->to_literal_list();
        }
        # TODO does this make sense as a seperate array
        if ($cmr->find('//cmr:text/@type')) {
            $result->{text_type} =
                $cmr->find('//cmr:text/@type')->to_literal_list();
        }
        if ($cmr->find('//cmr:canonicalUri')) {
            $result->{canonicalUri} =
                $cmr->find('//cmr:canonicalUri')->to_literal_list();
        }
        if ($cmr->find('//cmr:canonicalDownload')) {
            $result->{canonicalDownload} =
                $cmr->find('//cmr:canonicalDownload')->to_literal_list();
        }
        # TODO does this make sense as a seperate array
        if ($cmr->find('//cmr:canonicalDownload/@mime')) {
            $result->{canonicalDownload_mime} =
                $cmr->find('//cmr:canonicalDownload/@mime')->to_literal_list();
        }
        if ($cmr->find('//cmr:canonicalMaster')) {
            $result->{canonicalMaster} =
                $cmr->find('//cmr:canonicalMaster')->to_literal_list();
        }
        # TODO does this make sense as a seperate array
        if ($cmr->find('//cmr:canonicalMaster/@mime')) {
            $result->{canonicalMaster_mime} =
                $cmr->find('//cmr:canonicalMaster/@mime')->to_literal_list();
        }

        # POST the updated document in tdrmeta
        my $req = HTTP::Request->new(POST => $cosearch);
        $req->header('Content-Type' => 'application/json');
        $req->content(encode_json($result));
        my $res = $ua->request($req);
        
        print $res->status_line, " ", $result->{_id}, "\n"; # Feedback
    }
}

