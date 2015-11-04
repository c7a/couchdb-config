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

foreach my $filename (@ARGV){
	my $csv = Text::CSV->new({binary=>1}) or die "Cannot use CSV: ".Text::CSV->error_diag();
	open my $fh, "<:encoding(utf8)", $filename or die "Can't open ".$filename."\n";
	my $header = $csv->getline ($fh);
	#print join("-", @$header), "\n\n";
	process($fh, $csv, $header);	
}
exit;
			
		
sub process{
	my ($fh, $csv, $header) = @_;
	my %csv_data = ();
	
	while (my $row = $csv->getline($fh)){
		#get reel
		my $reel = get_reel($row);
		next unless ($reel);
		unless ($csv_data {$reel}){	
			$csv_data {$reel} = [];
		}
	push ($csv_data {$reel}, $row);	 	
	}
	

	#get page
	# Create json document for each reel, containing corresponding pages and tags
	my %page_data = ();
	foreach my $reel (keys(%csv_data)){	

		# process each page
		%page_data = get_page($csv_data{$reel});

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
			my $dt = DateTime->from_epoch( epoch => time );
			my $doc = {aip => $reel, page => $page, source => 'eqod', approved => "true", date_added => $dt->datetime(), tag => \%types};
		    json_eqod ($reel.".".$page."|eqod", $doc);	
	
		}
	}	
}
sub get_reel{
	my($row) = @_;

	# Reel information can only be extracted from the url column (#24)
	foreach ($row){
		#if the value matches a url sequence then extract the reel number
		if ($row->[24] =~ m{(.*/)([^?]*)}m){ 
			my ($url, $page) = $row->[24] =~ m{(.*/)([^?]*)}m;
			my $reel = substr $url, 34, 21;
			return $reel;
		}elsif ($row->[29] =~ m{(.*/)([^?]*)}m){
			my ($url, $page) = $row->[29] =~ m{(.*/)([^?]*)}m;
			my $reel = substr $url, 34, 21;
			return $reel;
		}else{
			#do nothing
		}
	}	
}	
sub get_page{
	my ($pages) = @_;
	my %page_data = ();
	
	
	# Get page number and corresponding rows
	foreach my $page (@{$pages}){
		my ($url, $page_id) = @$page[24] =~ m{(.*/)([^?]*)}m; #page number is acquired from url column
		next unless ($page_id);
		unless ($page_data {$page_id}){
			$page_data {$page_id} = [];
		}		
		push ($page_data {$page_id}, $page);
	}
	return %page_data;
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
sub get_date{
	my($y, $m, $d) = @_;
	my $date;
	
	# year values that start with 'circa' or 'after' - these will be handled as a single year
	if ($y =~ m{^[Cc]irca}m || $y =~ m{^[Aa]fter}m){
		$date = $y; #date
	}
	
	# year values that contain question marks 
	elsif ($y =~ m{\?}m){
		$date = $y; #date			
	}
	
	# year values that are regular format: yyyy
	elsif ($y =~ m{\d\d\d\d}m){
		$date = $y;
		#print $date;
		# if there is a month value create a date with yyyy-mm-dd 								
		if ($m){ #month2
			$m = get_month($m);
			$date = sprintf("%04d-%02d", $y, $m);	
		}
		if ($d){ #month2
			$date = sprintf("%04d-%02d-%02d", $y, $m, $d);	
		}
	}
	return $date;
}
sub get_month{
	my($month) = @_;
	
	#convert month to number
	my %mon2num = qw(
	jan 1  feb 2  mar 3  apr 4  may 5  jun 6
	jul 7  aug 8  sep 9  oct 10 nov 11 dec 12
	);	
	my $m = $mon2num{lc substr($month, 0, 3)};	
	return $m;
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


