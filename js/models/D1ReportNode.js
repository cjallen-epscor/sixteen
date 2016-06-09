/*global define */
define(['jquery', 
		'underscore', 
		'backbone', 
		'models/D1Node', 
		'models/D1SummaryNode', 
		'models/D1LogSummaryNode', 
		'models/D1TimeSeriesModel'],
	function($, 
			 _, 
			 Backbone, 
			 D1Node, 
			 D1SummaryNode, 
			 D1LogSummaryNode, 
			 D1TimeSeriesModel) {
	'use strict';

	var D1ReportNode = D1Node.extend({
		defaults: {
			countTotal: 0,
			countPackage: 0,
			countData: 0,
			countDownloads: 0,
			countMetadata: 0,
			bytesData: 0,
			bytesMetadata: 0,
			bytesPackage: 0,
			bytesTotal: 0,
			allFetched: false,
			uploadsByDate: {},
			downloadsByDate: {}
		},

		rangeFilterValue : '',

		pendingFetch: 0,

		d1SummaryNode : {},

		d1LogSummaryNode : {},

		downloadTimeSeriesModel : {},

		initialize: function(options) {
			this.rangeFilterValue = options.rangeFilterValue || '';
			var optionCopy = _.clone(options);
			this.d1SummaryNode = new D1SummaryNode(optionCopy);
		//	this.d1LogSummaryNode = new D1LogSummaryNode(options);
			
			optionCopy.query = 'nodeId: "' + this.id + '"%20event:read';
			optionCopy.dateFieldName = 'dateLogged';
			optionCopy.timeSeriesName = 'downloadsByDate';
			this.downloadTimeSeriesModel = new D1TimeSeriesModel(optionCopy);
		},

		// manually invoke fetch on all parts of report model
		// wait for all subModels to fetch before reporting this model is fetched
		// sub models set attribs into super model
		fetch: function() {
			this.pendingFetch = 2;

			this.listenTo(this.d1SummaryNode, 'change:fetched', this.handleModelFetched);
			this.d1SummaryNode.fetch();

			this.listenTo(this.downloadTimeSeriesModel, 'change:fetched', this.handleModelFetched);
			this.downloadTimeSeriesModel.fetch();

		//	this.listenTo(this.d1LogSummaryNode, 'change:fetched', this.handleModelFetched);
		//	this.d1LogSummaryNode.fetch();
	    },

	    handleModelFetched: function(modelObj) {
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
	    }

	});
	return D1ReportNode;
});
