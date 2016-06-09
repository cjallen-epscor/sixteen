/*global define */
define(['jquery',
				'underscore', 
				'backbone',
				'bootstrap'
				], 				
	function($, _, Backbone, Bootstrap) {
	'use strict';
	
	var app = app || {};
	
	// Our index page
	var IndexView = Backbone.View.extend({

		el: '#Content',
				
		initialize: function () {

		},
		
		// Render the main view and/or re-render subviews. Don't call .html() here
		// so we don't lose state, rather use .setElement(). Delegate rendering 
		// and event handling to sub views
		render: function () {
			console.log('Rendering dynamic subviews within the IndexView');
			
			// for big headers
			//appModel.set('headerType', 'main');
			
			// request a smaller header
			appModel.set('headerType', 'default');
			
			// clear
			this.$el.html('');
			
			// render any subviews here
			
			return this;
		},
		
		onClose: function () {			
			console.log('Closing the index view');
		}	
				
	});
	return IndexView;		
});
