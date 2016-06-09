/*global define */
define(['jquery', 'underscore', 'backbone', 'models/D1Node'], 				
	function($, _, Backbone, D1Node) {
	'use strict';

	var D1LogSummaryNode = D1Node.extend({
		
		// This model contains the attributes needed to report on a node's object holdings
		defaults: {
			fetched: false,
			countDownloads: 0,
			countUploads: 0, // create and update combined
			countDeletes: 0,
		},

		filter: '',
		query: '',
		endpoint: '',
		
		initialize: function(options) {
			console.log("D1LogSummaryNode Node Model class created.");
		    var rangeFilterValue = options.rangeFilterValue || '60MONTHS';
		    this.filter = options.filter || "dateLogged: [NOW-" + rangeFilterValue + "/DAY TO *]";
		    this.query = options.query || 'nodeId: "' + this.id + '"';
		    this.endpoint = options.endpoint || appModel.get('logServiceUrl');
		},
		
		url: function() {
			// do we have a filter?
			var compoundQuery = this.query;
			if (this.filter) {
				compoundQuery = this.query + "+" + this.filter;
		    }
			
			// the  raw results need to be processed
			var endpoint = appModel.get('logServiceUrl') 
			+ "&q=" + compoundQuery 
			+ "&rows=0"
			+ "&wt=json" 
			+ this.facets
			return endpoint;
		},
		  
		parse: function(solr) {
			
			// summarize the results by MN and object type
			var numFound = solr.response.numFound;
			var metadata = 0;
			var data = 0;
			var downloads = '-';
			var packages = 0;
			
			var facets = solr.facet_counts.facet_fields.formatType;
			for (var i = 0; i < facets.length; i++) {
				
				if (facets[i] == "RESOURCE") {
					packages = facets[i+1];
				}
				if (facets[i] == "METADATA") {
					metadata = facets[i+1];
				}
				if (facets[i] == "DATA") {
					data = facets[i+1];
				}
			}
			
			this.set({  countTotal: numFound,
						countPackage: packages,
						countData: data,
						countDownloads: downloads,
						countMetadata: metadata,
						bytesData: bytesData,
						bytesMetadata: bytesMetadata,
						bytesPackage: bytesPackage,
						bytesTotal: bytesTotal,
						uploadsByDate: solr.facet_counts.facet_dates.dateUploaded,
						fetched: true });
			
			return this;
		}
	});
	return D1LogSummaryNode;
});
