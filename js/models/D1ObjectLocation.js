/* global define */
define(['jquery', 'underscore', 'backbone'], 
	function($, _, Backbone){
		'use strict';
		
		// D1ObjectLocation Model
		//-----------------------
		
		var D1ObjectLocation = Backbone.Model.extend({
			defaults: {
				identifier: '',
				latitude: null,
				longitude: null,
				authoritativeNodeId: null
			}
		});
		return D1ObjectLocation;
	});