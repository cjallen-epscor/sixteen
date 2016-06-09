'use strict';

/* Configure the app to use requirejs, and map dependency aliases to their
   directory location (.js is ommitted). Shim libraries that don't natively 
   support requirejs. */
require.config({
  baseUrl: 'js',
  paths: {
    jquery: '../components/jquery-1.9.1',
    underscore: '../components/underscore',
    backbone: '../components/backbone',
    bootstrap: '../components/bootstrap311.min',
    tablesorter: '../components/jquery.tablesorter.min',
    text: '../components/require-text',
    moment: '../components/moment',
    colorbrewer: '../components/colorbrewer',
    d3: '../components/d3.v3.min',
  	domReady: '../components/domready',
  	async: '../components/async',
  	propertyParser: '../components/propertyParser',
  	markerClusterer: '../components/markerclusterer_compiled',
  	Zlib: '../components/gunzip.min',
  	progressbar: '../components/progressbar'
  },
  shim: { /* used for libraries without native AMD support */
    underscore: {
      exports: '_'
    },
    backbone: {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    bootstrap: { 
    	deps: ['jquery'],
    	exports: 'Bootstrap'
    },
    d3: {
        exports: 'd3'
    },
    colorbrewer: {
    	exports: 'colorbrewer'
    },
    tablesorter: { 
    	deps: ['jquery'],
    	exports: 'Tablesorter'
    },
  	markerClusterer: {
  		exports: "MarkerClusterer"
  	},
    Zlib: {
    	exports: 'Zlib'
    },
    progressbar: {
    	exports: 'progressBar'
    }
  }
});

var app = app || {};
var appView = appView || {};
var uiRouter = uiRouter || {};
var appModel = appModel || {};
var objectStatsModel = objectStatsModel || {};
var d1NodeList = d1NodeList || {};
var d1SpatialData = d1SpatialData || {};
var d1 = d1 || {};

define('gmaps', ['async!https://maps.googleapis.com/maps/api/js?v=3&key=AIzaSyCiQxAaBfEFxpsCn0qzLqHofFYN59aB7fA&sensor=false'], function() {
    return google.maps;
});

require(['backbone','underscore'],
function(Backbone, _) {
  'use strict';  
    d1.dispatcher = _.extend({}, Backbone.Events);
  }
);

/* require libraries that are needed  */
require(['backbone', 'bootstrap', 'routers/router', 'views/AppView', 'models/AppModel', 'collections/D1NodeList', 'collections/D1NodeStatusList', 'collections/D1SpatialData'],
function(Backbone, Bootstrap, UIRouter, AppView, AppModel, D1NodeList, D1NodeStatusList, D1SpatialData) {
	'use strict';  

  appModel = new AppModel();
  var contextPrefix = './';
  appModel.set('contextPrefix', contextPrefix);

  appView = new AppView();
	
  // carry on with the rest of the application loading
	var continueLoading = function() {
		console.log("Continuing with app initialization");
		// Initialize routing and start Backbone.history()
		uiRouter = new UIRouter();
		Backbone.history.start();  
	}
	
	console.log('Fetching d1SpatialData');
	d1SpatialData = new D1SpatialData();
	
	console.log(d1SpatialData);
	
	console.log("Fetching d1NodeList");

	d1NodeList = new D1NodeList();
	d1NodeList.fetch(
		{
			success: function(collection, response, options) {
				console.log("Loadeded d1NodeList");
        var statusList = new D1NodeStatusList();
        statusList.fetch({
          success: function(collection, response, options) {
            d1.dispatcher.trigger('d1Nodes-fetched');
		    		continueLoading();
          }
        });
			},
			error: function(collection, response, options) {
				console.log("Error loading d1NodeList: " + response);
				continueLoading();
			}
		});    	
  }
);
