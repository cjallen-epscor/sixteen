/* global define */
define(['jquery', 'underscore', 'backbone', 'models/D1NodeInfo'],
	function($, _, Backbone, D1NodeInfo) {
	
	'use strict';
	
	/* D1NodeInfoList collection - a list of D1NodeInfo models, extending D1Node */
	var D1NodeInfoList = Backbone.Collection.extend({
		
		// attributes per node coming from the redmine service		
		defaults: {
			nodeId: "*"
		},
		
		model: D1NodeInfo,
		
		initialize: function(options) {
			
			options = options || {};			
			// ?project_id=20&tracker_id=9&cf_31=*
			this.projectId = options.projectId || '20';
			this.trackerId = options.trackerId || '9';
			this.nodeId    = options.nodeId    || '*';
		},
		
		url: function() {
			console.log('Called D1NodeInfo.url()');
			var endpoint = appModel.get('nodeInfoServiceUrl') +
			'project_id=' + this.projectId + '&' +    // the project
			'tracker_id=' + this.trackerId + '&' +    // the tracker
			'cf_31=' + this.nodeId;                   // issues containing a NodeIdentifier value
	
			return endpoint;
		},
		
		/* Override fetch() to set the XML data type */
		fetch: function (options) {
	        options = options || {};
	        options.dataType = "xml";
	        return Backbone.Collection.prototype.fetch.call(this, options);
	    },
		
		/* Parse the result coming back from the D1 Node Info service (redmine) */
		parse: function(response, options) {
			console.log('D1NodeInfo.parse() called.');
			console.log(response);
			
			var nodeInfoList = [];
			
			$(response).find('issue').each(function(index) {
				var nodeSubject = $(this).find('subject').text();
				var latitude = $(this).find('custom_fields > custom_field[name="Latitude"] > value').text();
				var longitude = $(this).find('custom_fields > custom_field[name="Longitude"] > value').text();
				var nodeIdentifier = $(this).find('custom_fields > custom_field[name="NodeIdentifier"] > value').text();
				console.log("Parsing node info for: " + nodeIdentifier);
				var nodeInfo = new D1NodeInfo({
					id: nodeIdentifier,
					description: nodeSubject,
					lat: latitude,
					lon: longitude
				});
				
				// copy the other details over
				var currentNode = d1NodeList.findWhere({id: nodeIdentifier});
				if (currentNode) {
					console.log("Looked up: " + currentNode);
					nodeInfo.set(currentNode.attributes);
				}
				
				nodeInfoList.push(nodeInfo);
			});
			
			return nodeInfoList;
		}
						
	});
	
	return D1NodeInfoList;
});