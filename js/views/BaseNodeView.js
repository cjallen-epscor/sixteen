/*global define */
define(['jquery', 
		'underscore', 
		'backbone', 
		'views/TimeSeriesView', 
		'models/D1ReportNode'],
	function($,
		 _, 
		 Backbone, 
		 TimeSeriesView, 
		 D1ReportNode) {
	'use strict';
	
	// Build NodesView
	var BaseNodeView = Backbone.View.extend({

		filter: '60MONTHS',
		defaultFilter: '60MONTHS',
		filterValues: [],
		chartType: 'UPLOADS',
		d1StartDate : new Date('2012-06-01T00:00:00Z'),
		d1Months : '',

		initialize: function () {
			// model map - maps UI options to model for building the
			// corresponding view.  Arrays of D1ReportNodes.
			var diff = this.monthDiff(this.d1StartDate, new Date());
			this.d1Months = diff + 'MONTHS';
			//this.filterValues = ['12MONTHS', this.d1Months, '60MONTHS', '120MONTHS', '240MONTHS'];
			this.filterValues = [this.d1Months, '240MONTHS'];
			if (d1NodeList.length != null && d1NodeList.length > 0) {
				this.loadModel();
			} else {
				d1.dispatcher.on("d1Nodes-fetched", this.loadModel, this);
			}
		},

		createAndConfigChart: function() {
			// load the correct chart
			var dataKeyVal = 'uploadsByDate';
			var chartStyle = 'd1-data-uploads-line';
			var chartStyle2 = 'd1-meta-uploads-line';
			var xAxisLabel = 'Time';
			var yAxisLabel = 'Total File Uploads';
			var chartType = 'line';

			if (this.chartType === 'DOWNLOADS') {
				dataKeyVal = 'downloadsByDate';
				chartStyle = 'd1-data-downloads-fill';
				yAxisLabel = 'Data File Downloads';
				chartType = 'area';
			}

			this.chartView = new TimeSeriesView({dataKey:dataKeyVal,
												chartStyle : chartStyle,
												chartStyle2 : chartStyle2,
												chartType : chartType,
												xAxisLabel : xAxisLabel,
												yAxisLabel : yAxisLabel });
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
		
		postRender: function() {
			// scroll to passed in anchor ids
			// var anchorId = appModel.get('anchorId');
			// if (anchorId) {
			// 	this.scrollToAnchor(anchorId);
			// } else {
			// 	this.scrollToTop();
			// }
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
		},

	// based on: http://stackoverflow.com/questions/2536379/difference-in-months-between-two-dates-in-javascript
		monthDiff : function(date1, date2) {
		    var months = 0;
		    months = (date2.getFullYear() - date1.getFullYear()) * 12;
		    months -= date1.getMonth() + 1;
		    months += date2.getMonth();
		    return months <= 0 ? 0 : months;
		}
		
	});
	return BaseNodeView;		
});
