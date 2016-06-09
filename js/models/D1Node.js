/*global define */
define(['jquery', 'underscore', 'backbone'], 				
	function($, _, Backbone) {
	'use strict';

	// D1Node Model
	// ------------------
	var D1Node = Backbone.Model.extend({
		
		// This base model contains basic node information
		defaults: {
			id: '',
			shortId: '',
			name: '',
			description: '',
			lastHarvested: null,
			state: 'Unknown',
			nodeDocument : '',
			homeUrl : '',
			logoUrl : '',
			operationalDate : '',
			bcText : '',
			mainListDisplay: false,
			replicaListDisplay: false,
			upcomingListDisplay: false
		}
		
	});
	return D1Node;
});
