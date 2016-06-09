/* global define */
define(['jquery', 'underscore', 'backbone', 'models/D1Node'],
	function($, _, Backbone, D1Node) {
	
	'use strict';
	
	/* D1NodeInfo model - data coming from redmine.dataone.org currently, augmenting the D1 Node service */
	var D1NodeInfo = D1Node.extend({
		
		// attributes per node coming from the redmine service		
		defaults: {
			lat: 0,
			lon: 0
		}
				
	});
	
	return D1NodeInfo;
});