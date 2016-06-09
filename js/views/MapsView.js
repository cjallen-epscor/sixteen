/*global define */
define(['domReady!', 'jquery', 'underscore', 'backbone', 'gmaps', 'markerClusterer', 'text!templates/maps.html',
        'views/MapsView', 'collections/D1NodeInfoList', 'collections/D1SpatialData', 'progressbar'], 				
	function(doc, $, _, Backbone, gmaps, MarkerClusterer, MapsTemplate, MapsView, D1NodeInfoList, D1SpatialData, progressbar) {
	'use strict';
	
	// Build MapsView
	var MapsView = Backbone.View.extend({

		el: '#Content',
		
		template: _.template(MapsTemplate),
		
		d1NodeInfoList: null,
		
		markerClusterer: {},
	
		mappedObjects: {},
		objectMarkers: [],
		
		contextPath: '.',
		contextPathLoaded : false,

		markerImage10: '/img/d1-location-markers-plum-10px-25a.png',
		
		markerImage15: '/img/d1-location-markers-plum-15px-25a.png',
		
		markerImage20: '/img/d1-location-markers-plum-20px-25a.png',
		
		markerImage30: '/img/d1-location-markers-plum-30px-25a.png',
		
		markerImage40: '/img/d1-location-markers-plum-40px-25a.png',
		
		markerImage50: '/img/d1-location-markers-plum-50px-25a.png',
		
		markerImage60: '/img/d1-location-markers-plum-60px-25a.png',
		
		mapCenter: undefined,
		mapBounds: undefined,
		mapZoomLevel: undefined,
		recordMapValues: false,
				
		/* Constructor: register listeners */					
		initialize: function () {
			// Add the afterRender function to the object
			_.bindAll(this, 'afterRender');
			
			//this.collection.bind('reset', this.render, this);
			//gmaps.event.addDomListener(window, "load", this.renderMap);
	    }, 
		
		render: function () {
			if (this.contextPathLoaded === false) {
				this.contextPathLoaded = true;
				this.contextPath = appModel.get('contextPrefix');
				this.markerImage10 = this.contextPath + this.markerImage10;
				this.markerImage15 = this.contextPath + this.markerImage15;
				this.markerImage20 = this.contextPath + this.markerImage20;
				this.markerImage30 = this.contextPath + this.markerImage30;
				this.markerImage40 = this.contextPath + this.markerImage40;
				this.markerImage50 = this.contextPath + this.markerImage50;
				this.markerImage60 = this.contextPath + this.markerImage60;
			}
			// request a smaller header
			appModel.set('headerType', 'default');
			
			console.log('Rendering the maps view');

			// get the bulk of the dom template in

			var staticMapPath = 'static-map.png';
			if (this.contextPath !== '.') {
				staticMapPath = this.contextPath + staticMapPath;
			}
			this.$el.html(this.template({staticMapImgPath:staticMapPath}));
			
			var $mapViewTitle = this.$('#mapViewTitle');
			if ($('#page-title').length > 0) {
				 $mapViewTitle = $('#page-title');
			}
			$mapViewTitle.html("Data Distribution of Member Node Holdings");

			// Enableinteractive help for map page
			$('.popover-target').popover();
			
			this.renderMap();
			
			//gmaps.event.trigger(this.map, 'resize');		
			return this;
		},
				
		afterRender: function(map) {
			
			console.log('Called afterRender: '+this.mapBounds); 
			
			// Trigger a gmap resize event 
			gmaps.event.trigger(map, 'resize');
			
			// Set the bounds, center and zoom level for the map
			if(this.mapBounds != undefined)
			{
				map.fitBounds(this.mapBounds);
			}
			
			if(this.mapCenter != undefined)
			{
				map.setCenter(this.mapCenter);
			}
			
			if(this.mapZoomLevel != undefined)
			{
				map.setZoom(this.mapZoomLevel)
			}
			
			// Record bounds changes fromt his point on
			this.recordMapValues = true;
		},
		
		onClose: function () {			
			console.log('Closing the MapsView');
			
			// Don't record further bounds changes to the google map
			this.recordMapValues = false;
	
			this.stopListening(this.d1NodeInfoList, 'add');
		},
		
		renderMap: function() {
	
			console.log('Called MapsView.renderMap().');		
			
			if(this.map != undefined)
			{
				gmaps.event.trigger(this.map, 'resize');	
			}
			var mapCenter = new gmaps.LatLng(0.0, 0.0);

			var mcOptions = {
					gridSize: 25,
					styles: [
					         {height: 20, width: 20, url: this.markerImage20, textColor: '#FFFFFF'},
					         {height: 30, width: 30, url: this.markerImage30, textColor: '#FFFFFF'},
					         {height: 40, width: 40, url: this.markerImage40, textColor: '#FFFFFF'},
					         {height: 50, width: 50, url: this.markerImage50, textColor: '#FFFFFF'},
					         {height: 60, width: 60, url: this.markerImage60, textColor: '#FFFFFF'},
					         ]
			};

			var mapOptions = {
					zoom: 1,
					minZoom: 2,
					maxZoom: 15,
					center: mapCenter,
					mapTypeId: google.maps.MapTypeId.TERRAIN,
					disableDefaultUI: true,
					zoomControl: true,
					zoomControlOptions: {
						style: google.maps.ZoomControlStyle.SMALL
					},
					disableDoubleClickZoom: false
			};

			
			gmaps.visualRefresh = true;
			
			// Create and attach the google map to the map-canvas div
			this.map = new gmaps.Map($('#map-canvas')[0], mapOptions);
			
			// Setup a callback to afterRender to be called once the current
			// rendering callstack is complete to fix an issue with google
			// map rendering
			_.defer(this.afterRender, this.map);
		
			// Setup listeners for the map to catch changes in the map's 
			// bounds, center and zoom level
			var _map = this.map;
			var _this = this;
			google.maps.event.addListener(this.map, 'bounds_changed', function() {
				console.log("bounds have changed: "+_map.getBounds());
				
				if(_this.recordMapValues) {
					_this.mapBounds = _map.getBounds();
				}
			});
			
			google.maps.event.addListener(this.map, 'center_changed', function() {
				console.log("center has changed: "+_map.getCenter());
				
				if(_this.recordMapValues) {
					_this.mapCenter = _map.getCenter();
				}
			});
			
			google.maps.event.addListener(this.map, 'zoom_changed', function() {
				console.log("zoom level changed: "+_map.getZoom());
				
				if(_this.recordMapValues) {
					_this.mapZoomLevel = _map.getZoom();
				}
			});
			
			// Create the legend for the map
			var legend = $('#map-legend');
			var legendMNItem = document.createElement('tr');
			legendMNItem.innerHTML = '<td class="pagination-centered"><img src="' + this.contextPath + '/img/d1-location-markers-teal-15px.png"></td>' + 
			'<td>Member Node Repository</td>';
			legend.append(legendMNItem);
			var legendDataItem = document.createElement('tr');
			legendDataItem.innerHTML = '<td class="pagination-centered"><img src="' + this.contextPath + '/img/d1-location-markers-plum-30px-25a.png"></td>' + 
			'<td>Data packages by location</td>';
			legend.append(legendDataItem);
						
			var mapRef = this.map;
			console.log('Loading spatial data');
			this.stopListening(d1SpatialData, 'add');
			this.listenTo(d1SpatialData, 'add', this.addObjectMarker);
			var viewRef = this;
			
			var pb = progressBar();
	        mapRef.controls[google.maps.ControlPosition.RIGHT].push(pb.getDiv());
	        
	        
			// Clear the object markers
			if ( this.markerCluster ) {
				this.markerCluster.clearMarkers();
			}
			
			// Create a Marker Cluster
			this.objectMarkers = [];
			this.mappedObjects = {};
			
			//this.markerCluster = new MarkerClusterer(mapRef, this.objectMarkers, mcOptions);
			this.markerCluster = new MarkerClusterer(mapRef, [], mcOptions);
		
			// TODO: figure out the event timing above, but for now, iterate over d1SpatialData
			var addObjectMarkerRef = _.bind(this.addObjectMarker, this); 
			var markerClusterRef   = this.markerCluster;
			var length = d1SpatialData.models.length;
			var count = 0;
			
			pb.setTotal(2);
			pb.start(2);
			
			// When all of the tiles are loaded 
			google.maps.event.addListener(mapRef, 'tilesloaded', function() {
				console.log('tiles are loaded');
				
				pb.updateBar(1);
			});
			
			// Load the object markers
			_.each(d1SpatialData.models, 
				function(d1ObjectLocation)
				{
					var objectMarker = addObjectMarkerRef(d1ObjectLocation);
					
					markerClusterRef.addMarker(objectMarker, true);
				});
			 
			
			// Listener for when the marker cluster is finished.
			google.maps.event.addListener(markerClusterRef, 'clusteringend', function() {
				console.log('cluster is idle');	
				
				pb.setCurrent(length);
				pb.updateBar(1);
				//pb.hide();
			});
			
			// listen and fetch the info
			this.d1NodeInfoList = new D1NodeInfoList();
			this.stopListening(this.d1NodeInfoList, 'add');
			this.listenTo(this.d1NodeInfoList, 'add', this.addMarker);
			this.d1NodeInfoList.fetch();
		},
		
		/* Add a marker to the map */
		addMarker: function(nodeInfo) {
			console.log('Adding marker for: ' + nodeInfo.get('id'));
			var infoWindow = new gmaps.InfoWindow({
				content: '<h4>' + nodeInfo.get('name') +' (' + nodeInfo.get('shortId') +
				')' + '</h4><p>' + nodeInfo.get('description') + '</p>'
			});
			var markerImage = this.contextPath + "/img/d1-location-markers-teal-15px.png";
			var markerOptions = {
				position: new gmaps.LatLng(nodeInfo.get('lat'), nodeInfo.get('lon')),
				title: nodeInfo.get('id').split(':')[2],
				icon: markerImage,
				map: this.map,
				zIndex: 99999
			}
			var marker = new gmaps.Marker(markerOptions);
			gmaps.event.addListener(marker, 'click', function() {
				infoWindow.open(this.map, marker);
			});
		},
		
		/* add a marker for objects that will be clustered */
		addObjectMarker: function(d1ObjectLocation) {
			
			if(d1ObjectLocation.cid in this.mappedObjects == false) {
				var latLng = new gmaps.LatLng(d1ObjectLocation.get('latitude'), d1ObjectLocation.get('longitude'));
				var markerOptions = {
					position: latLng,
					icon: this.markerImage10,
					map: this.map
				}
				var objectMarker = new gmaps.Marker(markerOptions);
				this.mappedObjects[d1ObjectLocation.cid] = objectMarker;
				this.objectMarkers.push(objectMarker);
				
				return objectMarker;
			}
		}
				
	});
	
	return MapsView;		
});
