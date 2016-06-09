/*global define */
define(['jquery', 'underscore', 'backbone'], 				
	function($, _, Backbone) {
	'use strict';

	// D1TimeSeries Model, extends the base D1Node
	// ------------------
	var D1TimeSeriesModel = Backbone.Model.extend({

		defaults: {
			id: '',
			fetched: false,
		},

		filter: '',
		query: '',
		timeSeriesFacet: '',
		endpoint: '',
		dateFieldName: '',
		timeSeriesName: '',

		initialize: function(options) {
			this.dateFieldName = options.dateFieldName || 'dateLogged';
			this.timeSeriesName = options.timeSeriesName || 'timeSeries';

			var rangeFilterValue = options.rangeFilterValue || '60MONTHS';
		    this.filter = options.filter || this.dateFieldName + ": [NOW-" + rangeFilterValue + "/DAY TO *]";
		    this.query = options.query || 'nodeId:"' + this.id + '"';
		    this.timeSeriesFacet = options.timeSeriesFacet || '&facet=true&facet.date='+ this.dateFieldName +'&facet.date.start=NOW/MONTH-' + rangeFilterValue + '&facet.date.end=NOW/MONTH%2B1MONTH&facet.date.gap=%2B1MONTH';
			this.endpoint = options.endpoint || appModel.get('logServiceUrl');
		},
		
		url: function() {
			var compoundQuery = this.query;
			if (this.filter) {
				compoundQuery = this.query + "+" + this.filter;
		    }
			var urlString = this.endpoint 
				+ "&q=" + compoundQuery 
				+ "&rows=0" 
				+ "&wt=json" 
				+ this.timeSeriesFacet;
			return urlString;
		},
		  
		parse: function(solr) {
			var results = {};
			results[this.timeSeriesName] = solr.facet_counts.facet_dates[this.dateFieldName];
			results.fetched=true;

			// THIS IS CHEATING - field to be supplied by log summary model
			results.countDownloads = solr.response.numFound;
			
			this.set(results);
			return this;
		}
	});
	return D1TimeSeriesModel;
});