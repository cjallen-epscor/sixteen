/*global define */
define(['jquery', 
		'underscore', 
		'backbone', 
		'views/BaseNodeView', 
		'views/TimeSeriesView', 
		'text!templates/nodeDetail.html',
		'text!templates/loading.html', 
		'models/D1NodeSummaryModel'],
	function($,
		 _, 
		 Backbone, 
		 BaseNodeView, 
		 TimeSeriesView, 
		 NodeDetailTemplate, 
		 LoadingTemplate,
		 D1NodeSummaryModel) {
	'use strict';
	
	// Build NodesView
	var NodeDetailView = BaseNodeView.extend({

		el: '#Content',
		
		template: _.template(NodeDetailTemplate),

		alertTemplate: _.template(LoadingTemplate),
		
		chartView: null,
		
		nodeId: null,

		node: null,

		summaryModelMap:{},

		navFromSummary : false,

		events: {
			'click #dateSelect1': 'doFilter',
			'click #chartType1' : 'selectChart',
		},

		nodeNameList : [],

		loadModel: function() {
			d1NodeList.each(function(node) { 
								if (node.get("mainListDisplay") === true) {	
									this.nodeNameList.push(node.get("name")); }
							}, this);
			this.nodeNameList.sort(function (a, b) {
    									return a.toLowerCase().localeCompare(b.toLowerCase());
								   });
		},

		loadNodeModels: function(node) {
			var nodeId = node.id;
			var nodeSummaryModel = new D1NodeSummaryModel({timeRangeValues : this.filterValues, nodeId : nodeId});
			this.listenTo(nodeSummaryModel, 'change:fetched', this.nodeModelLoaded);
			nodeSummaryModel.fetch();
		},

		nodeModelLoaded: function(nodeModel) {
			this.stopListening(nodeModel,'change:fetched');
			this.summaryModelMap[nodeModel.nodeId] = nodeModel;
			if (this.nodeId === nodeModel.nodeId) {
				d1.dispatcher.trigger('node-detail-model-loaded');				
			} 
		},

		render: function () {

			d1.dispatcher.off('node-detail-model-loaded',this.render,this);

			var shortNodeId = appModel.get('shortNodeId');
			this.node = d1NodeList.getNodeByShortId(shortNodeId);
			this.nodeId = this.node.get('id');
			console.log('Rendering the nodes view for nodeId: ' + this.nodeId);

			// is the model complete?
			// (we should have one report node for every d1NodeList node)\
			if (this.summaryModelMap[this.nodeId] == null) {
				// model is still loading, inform user and ask for a callback
				// when the model is loaded.
				this.loadNodeModels(this.node);
				this.$el.html(this.alertTemplate());
				d1.dispatcher.on('node-detail-model-loaded', this.render, this);
				return this;
			}
			// request a smaller header
			appModel.set('headerType', 'default');

			var activeSummary = false;

			this.$('#Totals .popover-target').popover('destroy');
			this.$('#nodeDetailArea .popover-target').popover('destroy');
			this.$('#nodeDetailHeader .popover-target').popover('destroy');


			// prepare paging
			var nameIndex = this.nodeNameList.indexOf(d1NodeList.get(this.nodeId).get("name"));
			var prevNodeName = '';
			var nextNodeName = '';
			if (nameIndex === 0) {
				prevNodeName = this.nodeNameList[this.nodeNameList.length-1];
				nextNodeName = this.nodeNameList[nameIndex+1];
			} else if (nameIndex === (this.nodeNameList.length-1)) {
				prevNodeName = prevNodeName = this.nodeNameList[nameIndex-1] || '';
				nextNodeName = this.nodeNameList[0];
			} else if (nameIndex > -1) {
				prevNodeName = this.nodeNameList[nameIndex-1] || '';
				nextNodeName = this.nodeNameList[nameIndex+1] || '';
			}
			
			var prevNodeShortId = d1NodeList.getShortIdByNodeName(prevNodeName);
			var nextNodeShortId = d1NodeList.getShortIdByNodeName(nextNodeName);

			// get the bulk of the dom template in
			this.$el.html(this.template({nodeId: this.nodeId,
										filter: this.filter,
										chartType: this.chartType,
										activeSummary: activeSummary,
										d1Months : this.d1Months,
										nextNodeName : nextNodeName,
										nextNodeShortId : nextNodeShortId,
										prevNodeName : prevNodeName,
										prevNodeShortId : prevNodeShortId,
										node : this.node.toJSON()}));

			this.$summaryChart = this.$('#summaryChart');
			this.$chartTitle = this.$('#chartTitle');
			
			var $nodesViewTitle = this.$('#nodesViewTitle');
			if ($('#page-title').length > 0) {
				 $nodesViewTitle = $('#page-title');
			}
			var nodeName = d1NodeList.get(this.nodeId).get("name") || "Member Node";
			$nodesViewTitle.html("Detail of " + nodeName);

			this.setBreadcrumb();

			this.show();
			this.$('#Totals .popover-target').popover();
			this.$('#nodeDetailArea .popover-target').popover();
			this.$('#nodeDetailHeader .popover-target').popover();
			return this;
		},
		
		setBreadcrumb: function() {
			// set breadcrumb
			var bcText = this.node.get('bcText')
			if (bcText == null || bcText === '') {
				bcText = appModel.get('shortNodeId');
			}
			var breadcrumbElementSeperator = appModel.get('breadcrumbElementSeperator');
			var nodeSummaryBcEnd =  appModel.get('nodeSummaryBcEnd');
			var nodeSummaryBcLink = appModel.get('nodeSummaryBcLink');
			var breadcrumbDiv = $('#breadcrumb').find('.breadcrumb');
			
			if (breadcrumbDiv != null && breadcrumbDiv.length === 1) {
				
				var currentBreadcrumb = breadcrumbDiv.html();
				var nodeDetailBreadcrumb = ' ' + bcText;
				var newBreadcrumb = '';

				// matches to the end of the string (where the current page title would be)
				var isMatch = currentBreadcrumb.match(nodeSummaryBcEnd +"$");
								
				// a match means we are navigating from summary page or fresh load
				if (isMatch != null && isMatch.length === 1) {
					this.navFromSummary = true;

					// knock off 'current member nodes' text
					newBreadcrumb = currentBreadcrumb.substring(0, currentBreadcrumb.lastIndexOf(breadcrumbElementSeperator)+1);
					// add 'current member nodes' link
					newBreadcrumb += ' ' + nodeSummaryBcLink + ' ' + breadcrumbElementSeperator;
					// add node detail text;
					newBreadcrumb += nodeDetailBreadcrumb;
					breadcrumbDiv.html(newBreadcrumb);
				} else {
					this.navFromSummary = false;
					// navigating from another node detail page
					// knock off bc text
					newBreadcrumb = currentBreadcrumb.substring(0, currentBreadcrumb.lastIndexOf(breadcrumbElementSeperator)+1);
					// add node detail text
					newBreadcrumb += nodeDetailBreadcrumb;
					breadcrumbDiv.html(newBreadcrumb);
				}
			}
		},

		show: function () {
			this.$summaryChart.html('');
			this.createAndConfigChart();
			// render the chart
			var nodeSummaryModel = this.summaryModelMap[this.nodeId];

			var showD1Start = true;
			if (this.filter === this.d1Months || this.filter === '12MONTHS') {
				showD1Start = false;
			}
			
			this.filter = this.d1Months;
			showD1Start = false;

			this.chartView.renderChart(nodeSummaryModel.getTimeSeriesForRange(this.filter, 'dataTimeSeries'),
									   nodeSummaryModel.getTimeSeriesForRange(this.filter, 'metaTimeSeries'),
									   showD1Start);
			this.updateTotals();
			return this;
		},

		postRender: function() {
			if (this.navFromSummary === true) {
				this.scrollToTop();
			}
		},

		updateTotals: function() {
			var nodeSummaryModel = this.summaryModelMap[this.nodeId];
			//var summaryNode = nodeSummaryModel.get(this.filter);
			var summaryNode = nodeSummaryModel.get('240MONTHS');
			this.$('.countData').html(this.numberWithCommas(summaryNode.countData));
			this.$('.countMetadata').html(this.numberWithCommas(summaryNode.countMetadata));
			
			this.$('.bytesData').html(this.formatBytesForDisplay(summaryNode.bytesData));
			this.$('.bytesMetadata').html(this.formatBytesForDisplay(summaryNode.bytesMetadata));
		},

		doFilter: function(event) {
			$('#dateSelect1 button').blur();
			var element = event.target;
			var clickedValue = element.value;
			if (clickedValue !== this.filter) {
				$('#dateSelect1 button').removeClass('active');
				$(element).addClass('active');
				this.filter = clickedValue;
				this.render();
			}
		},

		selectChart: function(event) {
			$('#chartType1 button').blur();
			var element = event.target;
			var clickedValue = element.value;
			if (clickedValue !== this.chartType) {
				$('#chartType1 button').removeClass('active');
				$(element).addClass('active');
				this.chartType = clickedValue;
				this.render();
			}
		},

		onClose: function () {			
			console.log('Closing the nodes view');
			// stop listening to the nodelist, just in case
			this.stopListening(d1NodeList, 'add');
			this.$('#Totals .popover-target').popover('destroy');
			this.$('#nodeDetailArea .popover-target').popover('destroy');
			this.$('#nodeDetailHeader .popover-target').popover('destroy');
		}
		
	});
	return NodeDetailView;		
});

