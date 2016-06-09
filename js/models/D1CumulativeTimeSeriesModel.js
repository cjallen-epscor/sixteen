/*global define */
define(['jquery', 'underscore', 'backbone'], 				
	function($, _, Backbone) {
	'use strict';

	// D1TimeSeries Model, extends the base D1Node
	// ------------------
	var D1CumulativeTimeSeriesModel = Backbone.Model.extend({

		defaults: {
			datasource: '',
			fetched: false,
		},

		dateFieldName: 'dateUploaded',
		timeRange : '240MONTHS',
		typeFilter : '',
		timeSeriesFacet: '',
		query: '',
		endpoint: '',
		timeSeriesName: '',
		datasource:'',

		initialize: function(options) {
			this.datasource = options.datasource || '';
			if (this.datasource != null && this.datasource !== '') {
				this.query = 'datasource: "' + this.datasource + '"';
			}
			this.typeFilter = options.typeFilter || '';
			if (this.typeFiler !== '') {
				this.query = this.query + '+' + 'formatType:' + this.typeFilter;
			}
			this.query = this.query + '+' + this.dateFieldName + ':[NOW-' + this.timeRange + '/DAY TO *]';
			this.timeSeriesFacet = '&facet=true&facet.range=' + this.dateFieldName + '&facet.range.start=NOW/MONTH-' + this.timeRange + '&facet.range.end=NOW/MONTH%2B1MONTH&facet.range.gap=%2B1MONTH';
			this.endpoint = appModel.get('queryServiceUrl');
			this.timeSeriesName = options.timeSeriesName || 'timeSeries';
		},
		
		url: function() {
			var urlString = this.endpoint 
				+ "&q=" + this.query 
				+ "&rows=0" 
				+ "&wt=json" 
				+ this.timeSeriesFacet;
			return urlString;
		},
		  
		parse: function(solr) {
			var results = {};
			results[this.timeSeriesName] = [];
			var runningCount = 0;

			var monthCounts = solr.facet_counts.facet_ranges.dateUploaded.counts;
			for (var i = 0; i < monthCounts.length; i+=2) {
			    var date = monthCounts[i];
			    var countVal = monthCounts[i+1];
			    runningCount = runningCount + countVal;
			    results[this.timeSeriesName].push({date: new Date(date), y: runningCount});
			}

		//	results[this.timeSeriesName] = results[this.timeSeriesName].slice(0, results[this.timeSeriesName].length-1);
			results.fetched=true;
			results.datasource = this.datasource;
			this.set(results);
			return this;
		}
	});
	return D1CumulativeTimeSeriesModel;
});
