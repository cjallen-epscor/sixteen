/*global define */
define(['jquery', 'underscore', 'backbone', 'd3', 'colorbrewer'], 				
	function($, _, Backbone, d3, colorbrewer) {
	'use strict';
	
	var TimeSeriesView = Backbone.View.extend({

		el: '#summaryChart',
		chartType : '',
		chartStyle: '',
		chartStyle2: '',
		summarize : false,
		accumulate : false,
		mapped : true,
		dataKey : '',
		xAxisLabel : '',
		yAxisLabel : '',
		d1StartDate : new Date('2012-06-01T00:00:00Z'),

		initialize: function() {
			this.dataKey = this.options.dataKey || 'uploadsByDate';
			this.chartType = this.options.chartType || 'line';
			this.chartStyle = this.options.chartStyle || 'line';
			this.chartStyle2 = this.options.chartStyle2 || 'line';
			this.xAxisLabel = this.options.xAxisLabel || '';
			this.yAxisLabel = this.options.yAxisLabel || '';
			this.summarize = this.options.summarize || false;
			this.accumulate = this.options.accumulate || false;
			this.mapped = this.options.mapped || true;
		},

		render: function () {
			return this;
		},

		/**
		 * Adapted from http://bl.ocks.org/mbostock/3885211
		 */
		renderChart: function(d1NodeArray, d1NodeArray2, showD1Start) {
			
			if (showD1Start == null) {
				showD1Start = false;
			}

			// make the structure
			var values = [];
			var values2 = [];
			var nodeIds = [];

			if (this.summarize === true) {
				values = this.summarizeAndAccumulateData(d1NodeArray, this.dataKey);
				nodeIds[0] = 'summary'
			} else if (this.accumulate === true) {
				values = this.accumulateData(d1NodeArray, this.dataKey);
				nodeIds[0] = 'accumulate';
			} else if (this.mapped === true) {
				values = d1NodeArray;
				values2 = d1NodeArray2;
				nodeIds[0] = 'mapped';
				nodeIds[1] = 'mapped2';
			} else {
				values = this.mapData(d1NodeArray,this.dataKey);
				nodeIds = d1NodeArray.map(function(node) {return node.get('shortId')});
			}

		    var margin = {top: 50, right: 30, bottom: 50, left: 80};
		    var width = 700 - margin.left - margin.right;
		    var height = 400 - margin.top - margin.bottom;
	
		    var yMax = d3.max(values, function(value){ return value.y; });
		    var yMax2 = d3.max(values2, function(value){ return value.y; });
		    if (yMax2 > yMax) {
		    	yMax = yMax2;
		    }

		    // pad top of graph
		    yMax = yMax + Math.round(yMax * 0.1);
			var y = d3.scale.linear().range([height, 0]).domain([0, yMax]);

			var yAxis = d3.svg.axis().scale(y).orient("left").ticks(10);

			var x = d3.time.scale().range([0, width]);

			var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.time.format("%b %y"));

			// set ticks based on time frame....
			xAxis.ticks(10);
	
			var area = d3.svg.area()
			    .x(function(d)  { return x(d.date); })
			    .y0(function(d) { return y(d.y0); })
			    .y1(function(d) { return y(d.y0 + d.y); });
			
			var line = d3.svg.line()
			    .interpolate("basis")
			    .x(function(d) { return x(d.date); })
			    .y(function(d) { return y(d.y); });

			var stack = d3.layout.stack().values(function(d) { return d.values; });

			var svg = d3.select("#summaryChart").append("svg")
			    .attr("width", width + margin.left + margin.right)
			    .attr("height", height + margin.top + margin.bottom)
			  	.append("g")
			    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			

			// tick lines
			//adapted from: http://www.d3noob.org/2013/01/adding-grid-lines-to-d3js-graph.html
			var make_y_axis_ticks = function(y) {
	    		return d3.svg.axis()
	        		.scale(y)
	        		.orient("left")
	        		.ticks(10);
			}
		    svg.append("g")         
		        .attr("class", "grid")
		        .call(make_y_axis_ticks(y)
		        .tickSize(-width, 0, 0)
		        .tickFormat(""));

			var color = d3.scale.category20();
			color.domain(nodeIds);
			
			var browsers = stack(color.domain().map(function(name) {
			    return {
			      name: name,
			      values: values
			    };
			}));

			var browsers2 = stack(color.domain().map(function(name) {
			    return {
			      name: name,
			      values: values2
			    };
			}));

			x.domain(d3.extent(values, function(d){ return d.date; }));


			if (showD1Start === true) {
				svg.append("foreignObject")
		            .attr("width", 60)
		            .attr("height", 50)
		            .attr("x", x(this.d1StartDate) - 30)
		            .attr("y", height - 320)
	            	.append("xhtml:div")
	            	.attr("class", "graph-message")
	            	.html('D1 Start');
	            // d1 inception line.
				svg.append("line")
	            	.attr("x1", x(this.d1StartDate))
	                .attr("y1", y(0))
	                .attr("x2", x(this.d1StartDate))
	                .attr("y2", y(yMax))
	                .attr("class", "d1-marker-line");
            }

			var browser = svg.selectAll(".browser")
				.data(browsers)
			    .enter().append("g")
			  	.attr("class", "browser");

			var browser2 = svg.selectAll(".browser2")
				.data(browsers2)
			    .enter().append("g")
			  	.attr("class", "browser");
	
			if (this.chartType == 'area') {
				browser.append("path")
					.attr("class", "no-stroke")
					.attr("class", this.chartStyle)
			      	.attr("d", function(d) { return area(d.values); });
			} else {
				browser.append("path")
					.attr("class", this.chartStyle)
			      	.attr("d", function(d) { return line(d.values); });
			    browser2.append("path")
					.attr("class", this.chartStyle2)
					.attr("transform", "translate(-2,-2)")
			      	.attr("d", function(d) { return line(d.values); });
			}

			svg.append("g")
		      .attr("class", "x axis")
		      .attr("transform", "translate(0," + height + ")")
		      .call(xAxis);

			var gy = svg.append("g")
						.attr("class", "y axis")
						.call(yAxis);
						
			// var gy2 = svg.append("g")
			// 			.attr("class", "y axis")
			// 			.attr("transform", "translate(" + width + ",0)")
			// 			.call(yAxis2);

			svg.append("text")
			    .attr("class", "axis-label")
			    .attr("text-anchor", "end")
			    .attr("x", parseInt(width/2))
			    .attr("y", height + 35)
			    .text(this.xAxisLabel);

			svg.append("text")
			    .attr("class", "axis-label")
			    .attr("text-anchor", "end")
			    .attr("y", -40)
				.attr("x", -100)
			    .attr("dy", -20)
			    .text(this.yAxisLabel)
				.attr("transform", function(d) {
					return "rotate(-90)"
				});
		},

		summarizeAndAccumulateData : function(d1NodeArray,dataKey) {
			var summaryValues = {};
			var timeSeriesData = [];
			d1NodeArray.map(function(node) {
			  for (var d in node.get(dataKey)) {
				  if (d != "start" && d != "end" && d != "gap") {
				  	if (summaryValues[d] == null) {
				  		summaryValues[d] = node.get(dataKey)[d];
					} else {
						summaryValues[d] = summaryValues[d] + node.get(dataKey)[d];
					}
				  }
			  }
			});
			var runningTotal = 0;
			for (var valueKey in summaryValues) {
				runningTotal = runningTotal + summaryValues[valueKey];
    			timeSeriesData.push({date: new Date(valueKey), y: runningTotal});
    		}

    		return timeSeriesData;
		},

		accumulateData : function(d1NodeArray, dataKey) {
			var timeSeriesData = [];
			var runningTotal = 0;
			d1NodeArray.map(function(node) {	
				for (var d in node.get(dataKey)) {
					if (d != "start" && d != "end" && d != "gap") {
						runningTotal = runningTotal + node.get(dataKey)[d];
						timeSeriesData.push({date: new Date(d), y: runningTotal});
				  	}
			  	}
			});
			return timeSeriesData;
		},

		mapData : function(d1NodeArray, dataKey) {
			var timeSeriesData = [];
			d1NodeArray.map(function(node) {	
			  for (var d in node.get(dataKey)) {
				  if (d != "start" && d != "end" && d != "gap") {
					  timeSeriesData.push({date: new Date(d), y: node.get(dataKey)[d]});
				  }
			  }
			});
			return timeSeriesData;			
		},

		onClose: function () {			
			console.log('Closing a TimeSeriesView');
		}
		
	});
	return TimeSeriesView;		
});
