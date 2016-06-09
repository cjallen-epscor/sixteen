/* global define */
define(['jquery', 'underscore', 'backbone', 'models/D1ObjectLocation', 'Zlib'],
	function($, _, Backbone, D1ObjectLocation, Zlib) {
	
	'use strict';
	
	/* D1SpatialData collection - a list of objects with lat/lon properties */
	var D1SpatialData = Backbone.Collection.extend({
		
		// attributes per node coming from the spatial data endpoint (for now a single JSON file)	
		defaults: {
			fetched: false,
		},
		
		
		model: D1ObjectLocation,
		
		initialize: function(options) {
			options = options || {};
			// asynchronously pull in the spatial data
			this.fetch({
				headers: {// "Accept-Encoding" : "gzip,deflate,sdch",
						  // "Content-encoding" : "gzip",
						   },
				
		        dataType: "text",
				success: function(collection, response, options) {
					console.log("Loadeded d1SpatialData");
				},
				error: function(collection, response, options) {
					console.log("Error loading d1SpatialData: " + response);
				}
			});
			
		},
		
		url: function() {
			console.log('Called D1SpatialData.url()');
			var endpoint = appModel.get('spatialDataUrl');
	
			return endpoint;
		},
		
		parse: function(response, options) {
			console.log('D1SpatialData.parse() called.');
			
			
			function decodeB64(str) {
				  var c, decoded, fragment, i, op, n, table_length, v, il;
				  var table = [
				    62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1,
				    -1, -1, -2, -1, -1, -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9,
				    10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
				    -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
				    36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51
				  ];
				  table_length = table.length;
				  decoded = new Array((((table_length + 2) / 3) | 0) * 4);
				  c = n = op = 0;

				  for (i = 0, il = str.length; i < il; ++i) {
				    v = (str.charCodeAt(i) & 0xff) - 43;
				    if (v < 0 || v >= table_length) {
				      continue;
				    }
				    fragment = table[v];
				    if (fragment < 0) {
				      continue;
				    }
				    switch (n) {
				      case 0:
				        c = (fragment & 0x03f) << 2;
				        ++n;
				        break;
				      case 1:
				        c |= (fragment & 0x030) >> 4;
				        decoded[op++] = c;
				        c = (fragment & 0x00f) << 4;
				        ++n;
				        break;
				      case 2:
				        c |= (fragment & 0x03c) >> 2;
				        decoded[op++] = c;
				        c = (fragment & 0x003) << 6;
				        ++n;
				        break;
				      case 3:
				        c |= fragment & 0x03f;
				        decoded[op++] = c;
				        n = 0;
				    }
				  }
				  decoded.length = op;

				  return decoded;
				}
			
			// Decode and uncompress the data to a string
			var data = "";
			_.each(new Zlib.Gunzip(decodeB64(response)).decompress(), 
					function(char){
						data += String.fromCharCode(char);
					});
			
			// Convert to json and get the features field
			var features = jQuery.parseJSON(data).features;
			
			var results = [];
			_.each(features, function(feature){
				var identifier = feature.identifier || 'Identifier not set';
				var latitude = feature.g.c[1];
				var longitude = feature.g.c[0];
				var nodeId = feature.nodeId || 'Authoritative node ID not set';
				
				var d1ObjectLocation = new D1ObjectLocation({
					identifier: identifier,
					latitude: latitude,
					longitude: longitude,
					authoritativeNodeId: nodeId
				});
				results.push(d1ObjectLocation);
			});
			this.set({fetched:true});
			return results;
		}
						
	});
	
	return D1SpatialData;
});