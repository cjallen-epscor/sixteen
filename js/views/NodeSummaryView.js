/*global define */
define(['jquery', 
		'underscore', 
		'backbone', 
		'tablesorter',
		'views/BaseNodeView', 
		'views/NodeSummaryTableView', 
		'views/NodeSummaryReplicaTableView',
		'views/NodeSummaryUpcomingTableView',
		'views/TimeSeriesView', 
		'text!templates/nodeSummary.html',
		'text!templates/loading.html',
		'models/D1NodeSummaryModel'],
	function($,
		 _, 
		 Backbone, 
		 Tablesorter,
		 BaseNodeView, 
		 NodeSummaryTableView, 
		 NodeSummaryReplicaTableView,
		 NodeSummaryUpcomingTableView,
		 TimeSeriesView, 
		 NodeSummaryTemplate, 
		 LoadingTemplate,
		 D1NodeSummaryModel) {
	'use strict';
	
	// Build NodesView
	var NodeSummaryView = BaseNodeView.extend({

		el: '#Content',
		
		chartView: null,
		
		nodeSummaryModel : null,

		modelLoaded : false,

		showReplicaTable : false,

		showUpcomingTable : false,

		template: _.template(NodeSummaryTemplate),

		alertTemplate: _.template(LoadingTemplate),
		
		events: {
			'click #dateSelect': 'doFilter',
			'click #chartType' : 'selectChart'
		},

		loadModel: function() {
			this.nodeSummaryModel = new D1NodeSummaryModel({timeRangeValues : this.filterValues});
			this.listenTo(this.nodeSummaryModel, 'change:fetched', this.handleModelLoaded);
			this.nodeSummaryModel.fetch();

			d1NodeList.each(function(node) {
								if (node.get("replicaListDisplay") === true) {
									this.showReplicaTable = true;
								} }, this);

			d1NodeList.each(function(node) {
								if (node.get("upcomingListDisplay") === true) {
									this.showUpcomingTable = true;
								} }, this);
		},

		handleModelLoaded : function(modelObj) {
			this.stopListening(this.nodeSummaryModel, 'change:fetched');
			this.modelLoaded = true;
			d1.dispatcher.trigger('node-summary-model-loaded');
		},

		render: function () {
			d1.dispatcher.off('node-summary-model-loaded',this.render,this);
			if (this.modelLoaded === false) {
				this.$el.html(this.alertTemplate());
				d1.dispatcher.on('node-summary-model-loaded', this.render, this);
				return this;
			}

			this.$('#nodesTable .popover-target').popover('destroy');
			this.$('#Totals .popover-target').popover('destroy');

			console.log('Rendering the node summary view: ');

			// request a smaller header
			appModel.set('headerType', 'default');

			var activeSummary = true;

			// get the bulk of the dom template in
			this.$el.html(this.template({filter: this.filter,
										chartType: this.chartType,
										activeSummary: activeSummary,
										d1Months : this.d1Months}));

			this.$results = this.$('#summaryStats');
			this.$replicaResults = this.$('#replicaNodeTableBody');
			this.$upcomingResults = this.$('#upcomingNodeTableBody');

			if (this.showReplicaTable === false)  {
				this.$('#replicaNodeDiv').hide();
			}
			
			if (this.showUpcomingTable === false) {
				this.$('#upcomingNodeDiv').hide();
			}

			this.$nodesTable = this.$('#nodesTable');
			this.$summaryChart = this.$('#summaryChart');
			this.$chartTitle = this.$('#chartTitle');
			
			var $nodesViewTitle = this.$('#nodesViewTitle');
			if ($('#page-title').length > 0) {
				 $nodesViewTitle = $('#page-title');
			}
			$nodesViewTitle.html("Current Member Nodes Summary");

			this.setBreadcrumb();

			this.show();

			this.$('#nodesTable .popover-target').popover();
			this.$('#Totals .popover-target').popover();
			this.$('#replicationNodeTable .popover-target').popover();
			this.$('#upcomingNodeTable .popover-target').popover();
			return this;
		},

		setBreadcrumb: function() {
			var breadcrumbElementSeperator = appModel.get('breadcrumbElementSeperator');
			var nodeSummaryBcEnd =  appModel.get('nodeSummaryBcEnd');

			var breadcrumbDiv = $('#breadcrumb').find('.breadcrumb');
			
			if (breadcrumbDiv != null && breadcrumbDiv.length === 1) {
				
				var currentBreadcrumb = breadcrumbDiv.html();
				var newBreadcrumb = '';
				var isMatch = currentBreadcrumb.match(nodeSummaryBcEnd +"$");
				
				if (isMatch != null && isMatch.length === 1) {
					// already good, nothing to do
				} else {
					// coming from node detail, knock off 2 bc elements
					newBreadcrumb = currentBreadcrumb.substring(0, currentBreadcrumb.lastIndexOf(breadcrumbElementSeperator));
					newBreadcrumb = newBreadcrumb.substring(0, newBreadcrumb.lastIndexOf(breadcrumbElementSeperator)+1);
					newBreadcrumb += ' ' + nodeSummaryBcEnd;
					breadcrumbDiv.html(newBreadcrumb);
				}
			}
		},
		
		show: function () {
			// start from scratch
			this.$summaryChart.html('');
			this.$results.html('');

			this.createAndConfigChart();

			// build the summary table
			d1NodeList.each(this.addOne, this);

			// enable table sorting
			this.$nodesTable.tablesorter({ sortList: [[2,0]],
										   textExtraction: 'complex' });

			var showD1Start = true;
			if (this.filter === this.d1Months || this.filter === '12MONTHS') {
				showD1Start = false;
			}

			this.filter = this.d1Months;
			showD1Start = false;
			// render the chart
			this.chartView.renderChart(this.nodeSummaryModel.getTimeSeriesForRange(this.filter, 'dataTimeSeries'),
									   this.nodeSummaryModel.getTimeSeriesForRange(this.filter, 'metaTimeSeries'),
									   showD1Start);
			this.updateTable();
			this.updateTotals();
			return this;
		},

		// Add a single D1Node item to the list by creating a view for it, and
		// appending its element to the `<ul>`.
		addOne: function (node) {
			if (node.get('mainListDisplay') === true) {
				var view = new NodeSummaryTableView({ model: node });
				this.$results.append(view.render().el);
			} else if (node.get('replicaListDisplay') === true) {
				var view = new NodeSummaryReplicaTableView({ model: node });
				this.$replicaResults.append(view.render().el);
			} else if (node.get('upcomingListDisplay') === true) {
				var view = new NodeSummaryUpcomingTableView({ model: node });
				this.$upcomingResults.append(view.render().el);			
			}
		},	

		updateTable: function() {
			this.$nodesTable.trigger('update');
		},

		updateTotals: function() {
			//var summaryNode = this.nodeSummaryModel.get(this.filter);
			var summaryNode = this.nodeSummaryModel.get('240MONTHS');
			this.$('.countData').html(this.numberWithCommas(summaryNode.countData));
			this.$('.countMetadata').html(this.numberWithCommas(summaryNode.countMetadata));
			
			this.$('.bytesData').html(this.formatBytesForDisplay(summaryNode.bytesData));
			this.$('.bytesMetadata').html(this.formatBytesForDisplay(summaryNode.bytesMetadata));
		},

		postRender: function() {
			this.scrollToTop();
		},

		doFilter: function(event) {
			$('#dateSelect button').blur();
			var element = event.target;
			var clickedValue = element.value;
			if (clickedValue !== this.filter) {
				$('#dateSelect button').removeClass('active');
				$(element).addClass('active');
				this.filter = clickedValue;
				this.render();
			}
		},

		selectChart: function(event) {
			$('#chartType button').blur();
			var element = event.target;
			var clickedValue = element.value;
			if (clickedValue !== this.chartType) {
				$('#chartType button').removeClass('active');
				$(element).addClass('active');
				this.chartType = clickedValue;
				this.render();
			}
		},

		handleRowClick : function(event) {
			var rowElement = event.target;
			var elementName = rowElement.nodeName;
			if (elementName === 'A' || elementName === 'I') {
				return;
			}
			if (elementName === 'TD') {
				rowElement = rowElement.parentElement;
			}
			var shortNodeId = rowElement.id;
			console.log("row clicked: " + shortNodeId);
			uiRouter.navigate('nodes/'+shortNodeId, {trigger: true});
		},

		onClose: function () {			
			console.log('Closing the node summary view');
			// stop listening to the nodelist, just in case
			this.stopListening(d1NodeList, 'add');
			this.$('#nodesTable .popover-target').popover('destroy');
			this.$('#Totals .popover-target').popover('destroy');
			this.$('#replicationNodeTable .popover-target').popover('destroy');
			this.$('#upcomingNodeTable .popover-target').popover('destroy');
		},

	});
	return NodeSummaryView;		
});
