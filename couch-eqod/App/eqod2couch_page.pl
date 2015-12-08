#!/usr/bin/perl
# processes csv and posts to couch db


use 5.010;
use strict;
use warnings;

use utf8;
use JSON;
use Text::CSV;
use FindBin;
use lib "$FindBin::Bin/../lib";
use CouchDB;
use DateTime::Format::Strptime;
use Data::Dumper;

#my $fh = shift(@ARGV) || die "provide csv file";


foreach my $filename (@ARGV){
	my $csv = Text::CSV->new({binary=>1}) or die "Cannot use CSV: ".Text::CSV->error_diag();
	open my $fh, "<", $filename or die "Can't open ".$filename."\n";
	my $header = $csv->getline ($fh);
	process($fh, $csv, $header);	
}
exit;
			
		
sub process{
	my ($fh, $csv, $header) = @_;
	my %csv_data = ();
	
	#parse each row and extract the reel information
	while (my $row = $csv->getline($fh)){
	print Dumper($row);
		#get reel
		my $reel = get_reel($row, $header);
		print Dumper($row);
		next;
		die;
		next unless ($reel);
		unless ($csv_data {$reel}){	
			$csv_data {$reel} = [];
		}
		warn $reel;
		print Dumper($row);
		push ($csv_data {$reel}, $row);	 	
	}
	#print Dumper(%csv_data);
	die;

	# Create json document for each reel, containing corresponding pages and tags
	my %page_data = ();
	foreach my $reel (keys(%csv_data)){	

		#get page
		%page_data = get_page($csv_data{$reel}, $header);

		foreach my $page (sort({$a <=> $b} keys(%page_data))){

			#get properties
			my $properties = [];
			my %types = ();
			get_properties ($properties, $page_data{$page}, $header);

			#combine properties under the same tag
			foreach my $prop(@$properties){	
				my $value = $prop->{'value'};
				my $type = $prop->{'type'};
				
				unless ($types{$type}){
						$types{$type} = [];
				}
				push ($types{$type}, $value);
			} 
			#remove duplicate values
			foreach my $tag (keys(%types)){
				foreach my $value ($types{$tag}){
					my $values = remove_duplicates_array($value);
					$types{$tag} = [keys(%$values)];					
				}
			}
			#create json
			my $dt = DateTime->from_epoch( epoch => time ); #sets a utc timestamp
			my $doc = {aip => $reel, page => $page, source => 'eqod', approved => "true", date_added => $dt->datetime(), tag => \%types};
		    json_eqod ($reel.".".$page, $doc);	
	
		}
	}	
}
sub get_reel{
	my($rows, $header) = @_;


	# Reel information can only be extracted from the url column (#24)
	
	my %cells;
	foreach my $property(@$header){	
			#warn $property;
			my $value = shift(@$rows);
			
			next unless ($value);
			unless ($cells {$property}){
				$cells {$property} = [];
			}		
			push ($cells{$property}, $value);
	}
	
	#if the column matches URL then extract the value
	foreach my $tag(keys(%cells)){
		
		if ($tag eq "URLs" || $tag eq "URL"){
			my $value = shift($cells{$tag});
			warn $value;
			my ($url, $page) = $value =~ m{(.*/)([^?]*)}m;
			my $reel = substr $url, 34, 21;
			#warn $reel;
			#die;
			return $reel; 
			
						
		}else{
			#columns not used
			#warn "Header: $tag is not used";
		}
	}
}	
sub get_page{
	my ($pages, $header) = @_;
	#print Dumper($pages);
	#die;
	#TODO: create function for extracting URL column values
	my %page_data = ();
	my %cells;
	foreach my $property(@$header){	
		#warn $property;
			my $value = shift(@$pages);
			
			next unless ($value);
			unless ($cells {$property}){
				$cells {$property} = [];
			}		
			push ($cells{$property}, $value);
	}
	print Dumper(%cells);
	die;
	
	# Get page number and corresponding rows
	foreach my $tag(keys(%cells)){
		
			if ($tag eq "URLs" || $tag eq "URL"){
				my $value = shift($cells{$tag});
				warn $value;
				my ($url, $page_id) = $value =~ m{(.*/)([^?]*)}m;
				next unless ($page_id);
				unless ($page_data {$page_id}){
					$page_data {$page_id} = [];
				}		
				push ($page_data {$page_id}, $tag);
			}else{
			#columns not used
			#warn "Header: $tag is not used";
		}
			return %page_data;
					
	}
}

sub get_properties{
	my($properties, $pages, $header) = @_;

	# Eqod columns to Slim properties
	my %eqod2prop = (
		'Author' => 'person',
		'Place' => 'place',
        'Recipient' => 'person',
        'Name' => 'person',
        'Family Name' => 'person',
        'Year1' => 'date', 
        'Month1' => 'date',
        'Day1' => 'date',
        'Year2' => 'date',
        'Month2' => 'date',
        'Day2' => 'date',
        'URL' => undef,
        'NoteBook' => 'notebook', #Notebook is a potentially useful category for developing micro-collections - ways of organizing pages within reels (items)
        'Content/Comment' => 'description', 
	);
	
	#foreach header that matches an eqod property grab corresponding value for each page
	my %cells = ();
	foreach my $property(@$header){	
			my $value;
			foreach my $page(@$pages){
				$value = shift(@$page);
				
			}
			next unless ($value);
			unless ($cells {$property}){
				$cells {$property} = [];
			}		
			push ($cells{$property}, $value);
	}

	#if the header matches the eqod tag add it to properties   	
	foreach my $tag(keys(%cells)){
		if ($eqod2prop{$tag}){
			my $value = shift($cells{$tag});
			push (@$properties, add_eqod_property($eqod2prop{$tag}, $value));
			
		}else{
			#columns not used
			#warn "Header: $tag is not used";
		}
	}
	
	#process dates
	#TODO: this might be removed from script - couch can contain multiple date fields
			#if (@$page[8]){ #year1
			#	my $date = get_date(@$page[8], @$page[10], @$page[9]);	 #tag:date for year2
			#	push (@$properties, add_eqod_property("tag:date", $date));
			#}
		
			#if (@$page[11]){ #year2
			#	my $date = get_date(@$page[11], @$page[13], @$page[12]);	 #tag:date for year2
			#	push (@$properties, add_eqod_property("tag:date", $date));
			#}
#		}	
}

sub add_eqod_property{
	my($type, $value) = @_;
				
	my %property;
	if ($value){
		%property = (
		        type => $type,
		        value => $value
		    );
	}
	return \%property;
}
sub remove_duplicates_array{
	my($value) = @_;
	my %values = map {$_ => 1} @$value;
	return \%values;
}
sub json_eqod {
	my($uuid, $data) = @_;
	my $json = JSON->new->utf8(1)->pretty(1)->encode($data);
	
	#say $json;
	my $db = CouchDB->new('127.0.0.1', '5984');
	my $document = $db->put("externalmeta/$uuid/", $json);
	say $document;
	die;
}


