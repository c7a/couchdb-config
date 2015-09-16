#!/usr/bin/perl
use strict;
use warnings;
use utf8;

# Convert a DB/Text XML dump into Dublin Core and/or issueinfo records for
# Heritage documents.
# Work in progress

use XML::LibXML;
use XML::LibXML::XPathContext;

my $doc;
my $xpc;

foreach my $file (@ARGV) {
    print("Processing $file\n");
    $doc = XML::LibXML->load_xml(location => $file);
    $xpc = XML::LibXML::XPathContext->new($doc);
    process_doc($doc);
}

sub process_doc {
    my($doc) = @_;
    $xpc->registerNs('inm', 'http://www.inmagic.com/webpublisher/query');
    foreach my $record ($xpc->findnodes('inm:Results/inm:Recordset/inm:Record')) {
        process_record($record);
    }
}

sub process_record {
    my($record) = @_;
    my $doc = XML::LibXML::Document->new('1.0', 'UTF-8');
    my $type = $xpc->findvalue('inm:Type', $record);
    my $filename;


    if ($type eq 'Issue') {
        my $root = $doc->createElement('issueinfo');
        my $seq = $xpc->findvalue('inm:Reel_Number', $record);
        $filename = lc($seq);
        $seq =~ s/[^0-9]//g;
        $filename =~ s/\W//g;
        $filename = "lac_reel_$filename.xml";
        $root->setAttribute('xmlns', 'http://canadiana.ca/schema/2012/xsd/issueinfo');
        $doc->setDocumentElement($root);
        add_value($doc, 'series', join("_", "lac", "mikan", $xpc->findvalue('inm:Mikan', $record)));
        add_value($doc, 'title', join(' - ', $xpc->findvalue('inm:Title', $record), $seq));
        add_value($doc, 'sequence', $seq);
        add_field($doc, 'language', $xpc->findnodes('inm:Lang', $record));
        my $coverage_from = $xpc->findvalue('inm:Begin_Date', $record);
        my $coverage_to = $xpc->findvalue('inm:End_Date', $record);
        if ($coverage_from && $coverage_to) {
            my $coverage = $doc->createElement('coverage');
            $coverage->setAttribute('start', $coverage_from);
            $coverage->setAttribute('end', $coverage_to);
            $root->appendChild($coverage);
        }
        add_value($doc, 'source', "Library and Archives Canada / Bibliothèque et Archives Canada");
        foreach my $identifier ($xpc->findnodes('inm:Reel_Number', $record)) {
            my $value = $identifier->findvalue('.');
            next unless($value);
            my $node = $doc->createElement('identifier');
            $node->setAttribute('type', 'mikan_reel');
            $node->appendChild($doc->createTextNode($value));
            $root->appendChild($node);
        }
        foreach my $identifier ($xpc->findnodes('inm:Mikan', $record), $xpc->findnodes('inm:Mikan_F', $record), $xpc->findnodes('inm:Mikan_Other', $record)) {
            my $value = $identifier->findvalue('.');
            next unless($value);
            my $node = $doc->createElement('identifier');
            $node->setAttribute('type', 'mikan_number');
            $node->appendChild($doc->createTextNode($value));
            $root->appendChild($node);
        }
        foreach my $identifier ($xpc->findnodes('inm:Reference', $record)) {
            my $value = $identifier->findvalue('.');
            next unless($value);
            my $node = $doc->createElement('identifier');
            $node->setAttribute('type', 'mikan_reference');
            $node->appendChild($doc->createTextNode($value));
            $root->appendChild($node);
        }
    }
    elsif ($type eq 'Series') {
        my $root = $doc->createElement('simpledc');
        my $mikan = $xpc->findvalue('inm:Mikan', $record);
        $filename = "lac_mikan_$mikan.xml";
        $root->setAttribute('xmlns:dc', 'http://purl.org/dc/elements/1.1/');
        $doc->setDocumentElement($root);
        add_value($doc, 'dc:identifier', join("_", "lac", "mikan", $mikan));
        add_field($doc, 'dc:title', $xpc->findnodes('inm:Title', $record));
        add_field($doc, 'dc:title', $xpc->findnodes('inm:AT', $record));
        add_field($doc, 'dc:date', $xpc->findnodes('inm:Begin_Date', $record));
        add_field($doc, 'dc:date', $xpc->findnodes('inm:End_Date', $record));
        add_field($doc, 'dc:language', $xpc->findnodes('inm:Lang', $record));
        add_field($doc, 'dc:identifier', $xpc->findnodes('inm:Mikan_F', $record));
        add_field($doc, 'dc:identifier', $xpc->findnodes('inm:Mikan_Other', $record));
        add_field($doc, 'dc:identifier', $xpc->findnodes('inm:Reference', $record));
        add_field($doc, 'dc:identifier', $xpc->findnodes('inm:Archival_Reference', $record));
        add_field($doc, 'dc:identifier', $xpc->findnodes('inm:Collections', $record));
        add_field($doc, 'dc:subject', $xpc->findnodes('inm:Subject', $record));
        add_field($doc, 'dc:creator', $xpc->findnodes('inm:AU', $record));
        add_field($doc, 'dc:creator', $xpc->findnodes('inm:AN', $record));
        add_field($doc, 'dc:description', $xpc->findnodes('inm:Contents', $record));
        add_field($doc, 'dc:description', $xpc->findnodes('inm:Contents_F', $record));
        add_value($doc, 'dc:source', "Library and Archives Canada / Bibliothèque et Archives Canada");
    }
    else {
        die("Cannot process record with unknown type \"$type\"\n");
    }

    #print $doc->toString(1);
    $doc->toFile($filename, 1) or die("Error saving $filename: $!");

}

sub add_value {
    my($doc, $field, $value) = @_;
    return unless ($value);
    my $node = $doc->createElement($field);
    $node->appendChild($doc->createTextNode($value));
    $doc->documentElement->appendChild($node);
}

sub add_field {
    my($doc, $field, @list) = @_;
    foreach my $element (@list) {
        my $value = $element->findvalue('.');
        next unless ($value);
        my $text = $doc->createTextNode($value);
        my $node = $doc->createElement($field);
        $node->appendChild($text);
        $doc->documentElement->appendChild($node);
    }
}
