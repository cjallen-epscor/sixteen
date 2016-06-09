/*global define */
define(['jquery', 'underscore', 'backbone', 'd3', 'colorbrewer'], 				
	function($, _, Backbone, d3, colorbrewer) {
	'use strict';
	
	// Build StackedView
	var StackedView = Backbone.View.extend({

		el: '#summaryChart',
												
		initialize: function () {
		},
		
		render: function () {
			
			console.log('Rendering the Stacked view');
			
			//this.renderChart();
			
			return this;
		},
		
		/**
		 * Taken from http://bl.ocks.org/mbostock/3943967
		 */
		
		renderChart: function(d1NodeArray) {
			
		    // here's some sample data at first
		    var countData = [3,5,1,2];
		    var countMetadata = [7,10,4,8];
		    var countPackage = [7,10,4,8];
		    var countTotal = [10,15,5,10];
		    
		    // use real data form the input array
		    if (d1NodeArray) {
		    	countData = d1NodeArray.map(
		    			function(d, i) {
		    				return d.get('countData'); 
		    			});
		    	countMetadata = d1NodeArray.map(
		    			function(d, i) {
		    				return d.get('countMetadata'); 
		    			});
		    	countPackage = d1NodeArray.map(
		    			function(d, i) {
		    				return d.get('countPackage'); 
		    			});
		    	countTotal = d1NodeArray.map(
		    			function(d, i) {
		    				var theRest = d.get('countTotal');
		    				theRest -= d.get('countData'); 
		    				theRest -= d.get('countMetadata'); 
		    				theRest -= d.get('countPackage'); 
		    				return theRest; 
		    			});
		    }
		    
		    var augementData = function(d, i) {
				return {x: i, y: Math.max(0, d)}; 
			};
			
		    var data = new Array(countData.map(augementData), countMetadata.map(augementData), countPackage.map(augementData));

		    // figure out the data metrics
		    var m = data[0].length; // number of nodes
		    var n = data.length; // number of categories, assume all nodes have the same categories
		    
		    // customizations
		    var barColors = ['#289DBC', '#2285A0', '#1C6E84'];
		    //var barColors = colorbrewer.Blues[3];
		    
		    var stack = d3.layout.stack();
		    var layers = stack(data);
		    
		    var yGroupMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y; }); });
		    var yStackMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); });

			var margin = {top: 40, right: 10, bottom: 100, left: 100},
			    width = 960 - margin.left - margin.right,
			    height = 400 - margin.top - margin.bottom,
			    padding = 50;
	
			var xScale = d3.scale.ordinal()
			    .domain(d3.range(m))
//			    .domain(d1NodeArray.map(function(d) {
//    				return d.get('shortId'); 
//    			}))
//			    .range(d1NodeArray.map(function(d, i) {
//    				return i; 
//    			}))
			    .rangeRoundBands([0, width], .08);
	
			var y = d3.scale.linear()
			    .domain([0, yStackMax])
			    .range([height, 0]);
	
			// three options for color badges
			var color = d3.scale.ordinal()
		    	.domain(d3.range(n))
		    	.range(barColors);
	
			var axisFormat = function(d) {
				return d1NodeArray[d].get('shortId');
			};
			
			var xAxis = d3.svg.axis()
				.scale(xScale)
				.tickSize(0)
				.tickPadding(6)
				.tickFormat(axisFormat)
				.orient("bottom");
			
			// Define Y axis
			var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left")
				.ticks(5);
	
			var svg = d3.select(this.el).append("svg")
			    .attr("width", width + margin.left + margin.right)
			    .attr("height", height + margin.top + margin.bottom)
			  .append("g")
			    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
			var layer = svg.selectAll(".layer")
			    .data(layers)
			  .enter().append("g")
			    .attr("class", "layer")
			    .style("fill", function(d, i) { return color(i); });
	
			var rect = layer.selectAll("rect")
			    .data(function(d) { return d; })
			  .enter().append("rect")
			    .attr("x", function(d) { return xScale(d.x); })
			    .attr("y", height)
			    .attr("width", xScale.rangeBand())
			    .attr("height", 0);
	
			rect.transition()
			    .delay(function(d, i) { return i * 10; })
			    .attr("y", function(d) { return y(d.y0 + d.y); })
			    .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); });
	
			svg.append("g")
			    .attr("class", "x axis")
			    .attr("transform", "translate(0," + height + ")")
			    .call(xAxis)
			    // for the tilted axis labels
			    	.selectAll("text")  
		            .style("text-anchor", "end")
		            .attr("dx", "-.8em")
		            .attr("dy", ".15em")
		            .attr("transform", function(d) {
		                return "rotate(-65)" 
		                });
			
			// Create Y axis
			svg.append("g")
			    .attr("class", "axis")
			    //.attr("transform", "translate(" + padding + ",0)")
			    .call(yAxis);
			    
	
			d3.selectAll("input").on("change", change);
			
			var timeout = 0;
//			var timeout = setTimeout(function() {
//			  d3.select("input[value=\"grouped\"]").property("checked", true).each(change);
//			}, 2000);
	
			function change() {
			  clearTimeout(timeout);
			  if (this.value === "grouped") transitionGrouped();
			  else transitionStacked();
			}
	
			function transitionGrouped() {
			  y.domain([0, yGroupMax]);
	
			  rect.transition()
			      .duration(500)
			      .delay(function(d, i) { return i * 10; })
			      .attr("x", function(d, i, j) { return xScale(d.x) + xScale.rangeBand() / n * j; })
			      .attr("width", xScale.rangeBand() / n)
			    .transition()
			      .attr("y", function(d) { return y(d.y); })
			      .attr("height", function(d) { return height - y(d.y); });
			}
	
			function transitionStacked() {
			  y.domain([0, yStackMax]);
	
			  rect.transition()
			      .duration(500)
			      .delay(function(d, i) { return i * 10; })
			      .attr("y", function(d) { return y(d.y0 + d.y); })
			      .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); })
			    .transition()
			      .attr("x", function(d) { return xScale(d.x); })
			      .attr("width", xScale.rangeBand());
			}
	
			
		},
		
		onClose: function () {			
			console.log('Closing the nodes view');
		}
		
	});
	return StackedView;		
});
