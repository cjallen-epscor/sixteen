/*global define */
define(['jquery', 'underscore', 'backbone', 'models/D1Node'], 				
	function($, _, Backbone, D1Node) {
	'use strict';

	// D1SummaryNode Model, extends the base D1Node
	// ------------------
	var D1SummaryNode = D1Node.extend({
		
		// This model contains the attributes needed to report on a node's object holdings
		defaults: {
			countTotal: 0,
			countPackage: 0,
			countData: 0,
			countMetadata: 0,
			bytesData: 0,
			bytesMetadata: 0,
			bytesPackage: 0,
			bytesTotal: 0,
			fetched: false,
			uploadsByDate: {}
		},
		
		initialize: function(options) {
		    this.fields = options.fields || "datasource,id,title,formatType";
		    this.sort = options.sort || 'id desc';
		    this.rows = options.rows || 0;
		    this.facets = options.facets || '&facet=true&facet.limit=-1&facet.field=formatType';
		    this.stats = options.stats || '&stats=true&stats.field=size&stats.facet=formatType';

		    this.rangeFilterValue = options.rangeFilterValue || '60MONTHS';
		    this.filter = options.filter || "dateUploaded: [NOW-" + this.rangeFilterValue + "/DAY TO *]";
		    this.query = '';
		    if (this.id != null && this.id !== '') {
		    	this.query = options.query || 'datasource: "' + this.id + '"';
		    }

		    //'&facet.date=dateUploaded&facet.date.start=NOW/MONTH-1200MONTHS&facet.date.end=NOW/MONTH%2B1MONTH&facet.date.gap=%2B1MONTH';
		    this.timeSeriesFacets = options.timeSeriesFacets || '&facet.date=dateUploaded&facet.date.start=NOW/MONTH-' + this.rangeFilterValue + '&facet.date.end=NOW/MONTH%2B1MONTH&facet.date.gap=%2B1MONTH';

		},
		
		url: function() {
			// do we have a filter?
			var compoundQuery = this.query;
			if (this.filter) {
				compoundQuery = this.query + "+" + this.filter;
		    }
			
			// the  raw results need to be processed
			var endpoint = appModel.get('queryServiceUrl') 
			+ "fl=" + this.fields 
			+ "&q=" + compoundQuery 
			+ "&sort=" + this.sort 
			+ "&rows=" + this.rows 
			+ "&wt=json" 
			+ this.facets
			//+ this.timeSeriesFacets
			+ this.stats;
			return endpoint;
		},
		  
		parse: function(solr) {
			
			// summarize the results by MN and object type
			var numFound = solr.response.numFound;
			var metadata = 0;
			var data = 0;
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
			
			// collect the byte sizes from the facets
			var bytesData = 0;
			var bytesMetadata = 0;
			var bytesPackage = 0;	
			var bytesTotal = 0;
			
			// inspect the facets
			if (solr.stats.stats_fields.size) {
				bytesTotal = solr.stats.stats_fields.size.sum;
				
				if (solr.stats.stats_fields.size.facets) {
					if (solr.stats.stats_fields.size.facets.formatType.DATA) {
						bytesData = solr.stats.stats_fields.size.facets.formatType.DATA.sum;
					}
					if (solr.stats.stats_fields.size.facets.formatType.METADATA) {
						bytesMetadata = solr.stats.stats_fields.size.facets.formatType.METADATA.sum;
					}
					if (solr.stats.stats_fields.size.facets.formatType.RESOURCE) {
						bytesPackage = solr.stats.stats_fields.size.facets.formatType.RESOURCE.sum;
					}
				}
			}
			this.set({ countTotal: numFound,
						countPackage: packages,
						countData: data,
						countMetadata: metadata,
						bytesData: bytesData,
						bytesMetadata: bytesMetadata,
						bytesPackage: bytesPackage,
						bytesTotal: bytesTotal,
					//	uploadsByDate: solr.facet_counts.facet_dates.dateUploaded,
						fetched: true });
			
			return this;
		}
	});
	return D1SummaryNode;
});
