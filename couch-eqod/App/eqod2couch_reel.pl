#!/usr/bin/perl
#json output from eqod csv files

use 5.010;
use strict;
use warnings;

use FindBin;
use lib "$FindBin::Bin/../lib";
use Text::CSV;
use JSON;
use List::Util qw(first);
use File::Path qw(make_path);

foreach my $filename (@ARGV){
	my $csv = Text::CSV->new({binary=>1}) or die "Cannot use CSV: ".Text::CSV->error_diag();
	open my $fh, "<", $filename or die "Can't open ".$filename."\n";
	my $header = $csv->getline ($fh);
	process($fh, $csv, $header);	
}
exit;

sub process{
	my($fh, $csv, $header) = @_;
	
	#extract url column location
	my $url_column = get_url($header);
	
	# Get reel information and add corresponding pages to each reel
	my %csv_data = ();
	while (my $row = $csv->getline($fh)) {
		my $url = $row->[$url_column];
		my $reel = get_reel($url);
		next unless ($reel);
		unless ($csv_data {$reel}){	
			$csv_data {$reel} = [];
		}
		push ($csv_data {$reel}, $row);	 
	}
	
	# Create json document for each reel, containing corresponding pages and tags
	my %page_data = ();
	foreach my $reel (keys(%csv_data)){	
		#json structure
		
		# process each page
		%page_data = get_page($reel, $csv_data{$reel});
		foreach my $page (sort({$a <=> $b} keys(%page_data))){
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
			my $doc = {reel => $reel, page =>$page, tag => \%types};
			create_json ($reel, $reel.".".$page, ({document => {object => $doc}}));	
		}
	}	
}
sub get_url{
	my($header) = @_;
	
	#determine index location of URL column
	my $url_column = first {@$header[$_] eq 'URL' || @$header[$_] eq 'URLs'}0..@$header;
	return $url_column;
}
sub get_reel{
	my($url) = @_;
	
	# Reel information can only be extracted from the url column
	foreach ($url){
		#if the value matches a url sequence then extract the reel number
		if ($url =~ m{(.*/)([^?]*)}m){ 
			my ($uri, $page) = $url =~ m{(.*/)([^?]*)}m;
			my $reel = substr $uri, 34, 21;
			return $reel;
		}
	}	
}
sub get_page{
	my ($reel, $pages) = @_;
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
sub create_json {
	my($reel, $uuid, $data) = @_;
	
	#create necessary directories for each reel to organize page json files
	make_path('/Users/julienne/Desktop/eqod2couch/'.$reel, {
		verbose => 1,
		mode => 0711,
	});
	
	#output json files in each reel directory for each page
	my $json = JSON->new->utf8(1)->pretty(1)->encode($data);
	open my $fh, ">", "/Users/julienne/Desktop/eqod2couch/$reel/$uuid.json";
	print $fh $json;
}

