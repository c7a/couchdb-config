/**
 * @author Julienne Pascoe
 */

/*
 * check if a document with specific id already exists
 * if not create one with correct id
 * if it already exists update: add metadata.xml attachment 
 * make sure it does not overwrite previous metadata.xml attachments
 * add to the metadata.xml array
 * title of the attachment will be the timestamp
 */


function(doc, req){
	var nowdate = new Date();
	var nowdates = nowdate.toISOString.replace(/\..*Z/,"Z");
	var updated=false;
	
	if (!doc){
		if ('id' in req && req['id']) {
			// create new document
			doc = {};
			myid = req['id'];
			//id must conform to depositor.identifier - do we need repository info here?
			
			doc['_id'] = req['id'];
            doc['type'] = "item";
            doc['document date'] = nowdates;
            updated=true;
        } else {
          // change nothing in database
          return [null, '{"error": "Missing ID"}\n'];
        }
    }
    if ('form' in req) {
    	var updatedoc = req.form;
    	if ('metadata' in updatedoc){
    		doc['_attachments'] = updatedoc['metadata'];
    		doc['add date'] = nowdates;
    		//need to change the filename to the date of update
    		updated=true;	
    	} 	
    }			
        // We are transitioning from an older field to a new...
        // Setting of priority was separate
        
    if ('priority' in updatedoc) {
            doc['priority'] = updatedoc['priority'];
            updated=true;
    }
    if (updated) {
        return [doc, '{"return": "update"}\n'];
    } else {
        return [null, '{"return": "no update"}\n'];
    }
}
