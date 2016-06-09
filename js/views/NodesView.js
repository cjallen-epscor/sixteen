/*global define */
define(['jquery', 
		'underscore', 
		'backbone', 
		'tablesorter', 
		'views/D1NodeView', 
		'views/StackedView', 
		'views/TimeSeriesView', 
		'text!templates/nodes.html',
		'text!templates/alert.html', 
		'models/D1ReportNode'], 				
	function($,
		 _, 
		 Backbone, 
		 Tablesorter, 
		 D1NodeView, 
		 StackedView, 
		 TimeSeriesView, 
		 NodesTemplate, 
		 AlertTemplate,
		 D1ReportNode) {
	'use strict';
	
	// Build NodesView
	var NodesView = Backbone.View.extend({

		el: '#Content',
		
		template: _.template(NodesTemplate),

		alertTemplate: _.template(AlertTemplate),
		
		dataset: [],
		
		chartView: null,
		
		filter: '60MONTHS',

		chartType: 'UPLOADS',
		
		nodeId: null,

		modelMap:{},

		events: {
			'click #dateSelect': 'doFilter',
			'click #chartType' : 'selectChart'
		},
					
		initialize: function () {
			// model map - maps UI options to model for building the
			// corresponding view.  Arrays of D1ReportNodes.
			this.modelMap['12MONTHS'] = [];
			this.modelMap['60MONTHS'] = [];
			this.modelMap['120MONTHS'] = [];
			this.modelMap['240MONTHS'] = [];
			if (d1NodeList.length != null && d1NodeList.length > 0) {
				this.loadModel();
			} else {
				d1.dispatcher.on("d1Nodes-fetched", this.loadModel, this);
			}
		},

		loadModel: function() {
			d1NodeList.each(this.loadNodeReports, this);
		},

		// 5 year is default, first request five year data
		// then take a break (setTimeout) for 1 sec and request the
		// rest of the model.
		loadNodeReports: function(node) {
			var nodeAttributes = _.clone(node.attributes);
			for (var filterVal in this.modelMap) {
				if (filterVal === '60MONTHS') {
					var nodeArray = this.modelMap[filterVal];
					nodeAttributes.rangeFilterValue = filterVal;
					var reportNode = new D1ReportNode(nodeAttributes);
					this.listenTo(reportNode, 'change:fetched', this.nodeReportLoaded);
					reportNode.fetch();
				}
			}
			var that = this;
			setTimeout(function(){
				for (var filterVal in that.modelMap) {
					if (filterVal !== '60MONTHS') {
						var nodeArray = that.modelMap[filterVal];
						nodeAttributes.rangeFilterValue = filterVal;
						var reportNode = new D1ReportNode(nodeAttributes);
						that.listenTo(reportNode, 'change:fetched', that.nodeReportLoaded);
						reportNode.fetch();
					}
				}
			}, 1000);
		},

		// when the model array corresponding to current filter (time range)
		// is full, trigger event that node view model is loaded.
		nodeReportLoaded: function(reportNode) {
			this.stopListening(reportNode,'change:fetched');
			var filterVal = reportNode.rangeFilterValue;
			var nodeArray = this.modelMap[filterVal];
			nodeArray.push(reportNode);
			if (nodeArray.length === d1NodeList.length) {
				console.log("model loaded for filter: " + filterVal);
				if (this.filter === filterVal) {
					d1.dispatcher.trigger('node-view-model-loaded');
				}
			}

		},
		
		render: function () {
			d1.dispatcher.off('node-view-model-loaded',this.render,this);
			// get the model
			var nodeArray = this.modelMap[this.filter];
			
			// is the model complete?
			// (we should have one report node for every d1NodeList node)
			if (nodeArray.length < d1NodeList.length) {
				// model is still loading, inform user and ask for a callback
				// when the model is loaded.
				this.$el.html(this.alertTemplate());
				d1.dispatcher.on('node-view-model-loaded', this.render, this);
				return this;
			}

			this.nodeId = appModel.get('nodeId');		
			console.log('Rendering the nodes view for nodeId: ' + this.nodeId);

			// request a smaller header
			appModel.set('headerType', 'default');

			var activeSummary = false;
			if (this.nodeId == null) {
				activeSummary = true;
			}

			// get the bulk of the dom template in
			this.$el.html(this.template({nodeId: this.nodeId,
										filter: this.filter,
										chartType: this.chartType,
										activeSummary: activeSummary }));

			this.$results = this.$('#summaryStats');
			this.$nodesTable = this.$('#nodesTable');
			this.$summaryChart = this.$('#summaryChart');
			this.$chartTitle = this.$('#chartTitle');
			
			var $nodesViewTitle = this.$('#nodesViewTitle');
			if (this.nodeId != null) {
				var nodeName = d1NodeList.get(this.nodeId).get("name") || "Member Node";
				$nodesViewTitle.html("Summary of " + nodeName);
			} else {
				$nodesViewTitle.html("Summary of Data Repositories");
			}
			this.show();
			return this;
		},
		
		show: function () {
			// start from scratch
			this.dataset = [];
			this.$summaryChart.html('');
			this.$results.html('');

			this.createAndConfigChart();

			// get the model
			var nodeArray = this.modelMap[this.filter];

			// build the summary table
			_.each(nodeArray, this.addOne, this);

			// enable table sorting
			this.$nodesTable.tablesorter({ textExtraction: 'complex' });

			this.dataset = this.dataset.sort(function(a,b) {
				return a.get('id').localeCompare(b.get('id'));
			});
			// render the chart
			this.chartView.renderChart(this.dataset);
			this.updateTable();
			this.updateTotals();

			return this;
		},
		
		// Add a single D1Node item to the list by creating a view for it, and
		// appending its element to the `<ul>`.
		addOne: function (node) {
			if (this.nodeId && this.nodeId != node.get('id')) {
				return;
			}
			var view = new D1NodeView({ model: node });
			this.$results.append(view.render().el);
			
			// push to the chart
			this.dataset.push(node);
		},

		createAndConfigChart: function() {
			// load the correct chart
			var dataKeyVal = 'uploadsByDate';
			var fillClassVal = 'd1-total-files-fill';
			var xAxisLabel = 'Time';
			var yAxisLabel = 'Total File Uploads';
			var summarize = false;
			if (this.nodeId == null) {
				summarize = true;
			}

			if (this.chartType === 'DOWNLOADS') {
				dataKeyVal = 'downloadsByDate';
				fillClassVal = 'd1-data-downloads-fill';
				yAxisLabel = 'Data File Downloads'
			}

			this.chartView = new TimeSeriesView({dataKey:dataKeyVal,
												fillClass:fillClassVal,
												xAxisLabel : xAxisLabel,
												yAxisLabel : yAxisLabel,
												summarize : summarize });

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

		updateTotals: function() {
			var countTotal = 0,
				countPackage = 0,
				countData = 0,
				countDownloads = 0,
				countMetadata = 0,
				bytesTotal = 0,
				bytesPackage = 0,
				bytesData = 0,
				bytesDownloads = 0,
				bytesMetadata = 0;
			
			_.each(this.dataset, function(node) {
				countTotal += node.get('countTotal');
				countPackage += node.get('countPackage');
				countData += node.get('countData');
				countDownloads += node.get('countDownloads');
				countMetadata += node.get('countMetadata');
				
				bytesTotal += node.get('bytesTotal');
				bytesPackage += node.get('bytesPackage');
				bytesData += node.get('bytesData');
				bytesDownloads += node.get('bytesDownloads');
				bytesMetadata += node.get('bytesMetadata');
			});
			
			this.$('.countTotal').html(this.numberWithCommas(countTotal));
			this.$('.countPackage').html(this.numberWithCommas(countPackage));
			this.$('.countData').html(this.numberWithCommas(countData));
			this.$('.countDownloads').html(this.numberWithCommas(countDownloads));
			this.$('.countMetadata').html(this.numberWithCommas(countMetadata));
			
			this.$('.bytesTotal').html(this.formatBytesForDisplay(bytesTotal));
			this.$('.bytesPackage').html(this.formatBytesForDisplay(bytesPackage));
			this.$('.bytesData').html(this.formatBytesForDisplay(bytesData));
			//this.$('.bytesDownloads').html(this.numberWithCommas(bytesDownloads));
			this.$('.bytesMetadata').html(this.formatBytesForDisplay(bytesMetadata));
		},
		
		formatBytesForDisplay : function(fileSizeInBytes) {
		    var i = -1;
		    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
		    do {
		        fileSizeInBytes = fileSizeInBytes / 1024;
		        i++;
		    } while (fileSizeInBytes > 1024);
		    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
		},
		
		// see: http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
		numberWithCommas: function (x) {
		    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		},
		
		updateTable: function() {
			// let the tablesorter know we changed it
			this.$nodesTable.trigger('update');
			// this isn't quite working
			/*
			if (this.$results.children("tr").length > 1) {	
				var sorting = [[1,0]]; 
				this.$nodesTable.trigger("sorton", [sorting] );
			}
			*/
			
			// Enable some interactive help for the metrics table
			this.$('#nodesTable .popover-target').popover();
			
		},
		
		onClose: function () {			
			console.log('Closing the nodes view');
			// stop listening to the nodelist, just in case
			this.stopListening(d1NodeList, 'add');
		},
		
		postRender: function() {
			// scroll to passed in anchor ids
			var anchorId = appModel.get('anchorId');
			if (anchorId) {
				this.scrollToAnchor(anchorId);
			} else {
				this.scrollToTop();
			}			
		},
		
		// scroll to the anchor given to the render function
		scrollToAnchor: function(anchorId) {
			var anchorTag = $("a[name='" + anchorId + "']" );
			console.log('Scrolling ' + anchorId + ' to offset.top: ' + anchorTag.offset().top);
			$('html,body').animate({scrollTop: anchorTag.offset().top}, 'slow');
		},
		
		// scroll to top of page
		scrollToTop: function() {
			$("html, body").animate({ scrollTop: 0 }, "slow");
			return false;
		}
		
	});
	return NodesView;		
});
