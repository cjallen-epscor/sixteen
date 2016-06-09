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

	var D1NodeList = Backbone.Collection.extend({
		
		model: D1Node,

		url: function() {
			var endpoint = appModel.get('drupalNodeInfoListUrl');
			return endpoint;
		},
		
	    getNodeByShortId : function(shortNodeId) {
	    	for (var i in this.models) {
	    		var node = this.models[i];
	    		if (node.get('shortId') === shortNodeId) {
	    			return node;
	    		}
	    	}
	    },

	   	getNodeById : function(nodeId) {
	    	for (var i in this.models) {
	    		var node = this.models[i];
	    		if (node.get('id') === nodeId) {
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

	    parse: function(nodeData) {
			var nodeList = [];
			
			for (var i = 0; i < nodeData.length; i++) {
			   	var node = nodeData[i];
			   	var nodeId = node.node_id;
				var shortId = nodeId.split(":")[2];
				var name = node.name;
				var description = node.description;
				var homeUrl = node.home_url;
				var nodeDoc = node.mn_document;
				var logoUrl = node.logo_url;
				var bcText = node.bc_text;
				var onlineDate = node.online_date;
				var mainListDisplay = false;
				if (node.main_list_display === 'true') {
					mainListDisplay = true;
				}
				var replicaListDisplay = false;
				if (node.replica_list_display === 'true') {
					replicaListDisplay = true;
				}
				var upcomingListDisplay = false;
				if (node.upcoming_list_display === 'true') {
					upcomingListDisplay = true;
				}
                var d1Node = new D1Node({
                	id: nodeId,
					shortId: shortId,
                    name: name,
					description: description,
					operationalDate: onlineDate,					
					nodeDocument: nodeDoc,
					homeUrl: homeUrl,
					logoUrl: logoUrl,
					bcText: bcText,
					mainListDisplay: mainListDisplay,
					replicaListDisplay: replicaListDisplay,
					upcomingListDisplay: upcomingListDisplay
				});
           		nodeList.push(d1Node);
			}
			return nodeList;
	    },
	});
	return D1NodeList;		
});
