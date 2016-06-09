/*global define */
define(['jquery', 
		'underscore', 
		'backbone', 
		'models/D1Node'],
	function($,
			 _, 
			 Backbone, 
			 D1Node) {
	'use strict';

	var D1NodeStatusList = Backbone.Collection.extend({
		
		model: D1Node,

		url: function() {
			var endpoint = appModel.get('nodeServiceUrl');
			return endpoint;
		},
		
		fetch: function (options) {
	        options = options || {};
	        options.dataType = "xml";
	        return Backbone.Collection.prototype.fetch.call(this, options);
	    },

	    getNodeByShortId : function(shortNodeId) {
	    	for (var i in this.models) {
	    		var node = this.models[i];
	    		if (node.get('shortId') === shortNodeId) {
	    			return node;
	    		}
	    	}
	    },

	    getShortIdByNodeName : function(nodeName) {
	    	for (var i in this.models) {
	    		var node = this.models[i];
	    		if (node.get('name') === nodeName) {
	    			return node.get('shortId');
	    		}
	    	}
	    	return '';
	    },

		parse: function(xmlData) {
			$(xmlData).find("node[type='mn']").each(function(index, element) {

				var id = $(element).find("identifier").text();
				var node = d1NodeList.getNodeById(id);
				if (node != null) {
					var lastHarvested = $(element).find("lastHarvested").text();
					var state = $(element).attr("state");
					if (state === "up") {
						state = "OK";
					} else if (state === "down") {
						state = "Down";
					} else if (state === "unknown") {
						state = "Unknown";
					}

					console.log('Processing node id: ' + id);

					if (lastHarvested) {
						lastHarvested = new Date(lastHarvested);
						lastHarvested = (lastHarvested.getMonth() + 1) + '/' + lastHarvested.getDate() + '/' +  lastHarvested.getFullYear();
					}
					node.set('state', state);
					node.set('lastHarvested', lastHarvested);
				}
			});
		},
	});
	return D1NodeStatusList;		
});
