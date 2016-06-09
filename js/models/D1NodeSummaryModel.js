/*global define */
define(['jquery', 
		'underscore', 
		'backbone', 
		'models/D1Node', 
		'models/D1SummaryNode', 
		'models/D1CumulativeTimeSeriesModel'],
	function($, 
			 _, 
			 Backbone, 
			 D1Node, 
			 D1SummaryNode, 
			 D1CumulativeTimeSeriesModel) {
	'use strict';

	var D1NodeSummaryModel = Backbone.Model.extend({
		defaults: {
			allFetched: false,
			summaryMap : {},
			dataTimeSeries: {},
			metaTimeSeries: {},
			nodeSummary:{}
		},

		nodeId : null,
		timeRangeValues : [],

		pendingFetch: 0,

		d1SummaryMap : {},
		dataTimeSeriesModel : null,
		metaTimeSeriesModel : null,
		nodeSummaryModel : null,

		initialize: function(options) {
			this.timeRangeValues = options.timeRangeValues || [];
			this.nodeId = options.nodeId || null;
			this.dataTimeSeriesModel = new D1CumulativeTimeSeriesModel({typeFilter:'DATA', timeSeriesName: 'dataTimeSeries', datasource:this.nodeId});
			this.metaTimeSeriesModel = new D1CumulativeTimeSeriesModel({typeFilter:'METADATA', timeSeriesName: 'metaTimeSeries', datasource:this.nodeId});
			for (var filterVal in this.timeRangeValues) {
				this.d1SummaryMap[this.timeRangeValues[filterVal]] = new D1SummaryNode({rangeFilterValue:this.timeRangeValues[filterVal], id:this.nodeId});
			}
		},
		
		// manually invoke fetch on all parts of report model
		// wait for all subModels to fetch before reporting this model is fetched
		// sub models set attribs into super model
		fetch: function() {
			this.pendingFetch = 2;
			this.listenTo(this.dataTimeSeriesModel, 'change:fetched', this.handleTimeSeriesFetched);
			this.dataTimeSeriesModel.fetch();
			this.listenTo(this.metaTimeSeriesModel, 'change:fetched', this.handleTimeSeriesFetched);
			this.metaTimeSeriesModel.fetch();

			this.pendingFetch++;
			var d1SummaryNode = this.d1SummaryMap['240MONTHS'];
			this.listenTo(d1SummaryNode, 'change:fetched', this.handleSummaryFetched);
			d1SummaryNode.fetch();

			// this.pendingFetch = this.pendingFetch + this.timeRangeValues.length;
			// for (var filterVal in this.timeRangeValues) {
			// 	var d1SummaryNode = this.d1SummaryMap[this.timeRangeValues[filterVal]];
			// 	this.listenTo(d1SummaryNode, 'change:fetched', this.handleSummaryFetched);
			// 	d1SummaryNode.fetch();
			// }
	    },

	    handleSummaryFetched: function(d1NodeSummary) {
	    	this.stopListening(d1NodeSummary, 'change:fetched');
	    	this.pendingFetch--;

	    	var nodeSummary = {};
			nodeSummary.countData = d1NodeSummary.get('countData');
			nodeSummary.countMetadata = d1NodeSummary.get('countMetadata');
			nodeSummary.bytesData = d1NodeSummary.get('bytesData');
			nodeSummary.bytesMetadata = d1NodeSummary.get('bytesMetadata');
			var props = {};
			props[d1NodeSummary.rangeFilterValue] = nodeSummary;
			this.set(props);
	    	if (this.pendingFetch === 0) {
	    		this.set({fetched:true});
	    	}
	    },

	    handleTimeSeriesFetched: function(modelObj) {
	    	this.stopListening(modelObj, 'change:fetched');
	    	this.pendingFetch--;
	    	
	    	var attributes = _.clone(modelObj.toJSON());
	    	delete attributes.id;
	    	delete attributes.fetched;

	    	// copy data from sub model into report model
	    	this.set(attributes);
	    	if (this.pendingFetch === 0) {
	    		this.set({fetched:true});
	    	}
	    },

		getTimeSeriesForRange: function(timeRange, timeSeriesName) {
			var monthsToGet = parseInt(timeRange.slice(0,timeRange.indexOf("M")));
			return this.get(timeSeriesName).slice(this.get(timeSeriesName).length - monthsToGet);
		}

	});
	return D1NodeSummaryModel;
});
