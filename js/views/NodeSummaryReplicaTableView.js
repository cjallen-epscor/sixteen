/*global define */
define(['jquery', 'underscore', 'backbone', 'text!templates/nodeSummaryReplicaNode.html'], 				
	function($, _, Backbone, nodeSummaryReplicaTemplate) {
	
	'use strict';

	// The DOM element for a SearchResult item...
	var NodeSummaryReplicaTableView = Backbone.View.extend({
		
		// Cache the template function for a single item.
		template: _.template(nodeSummaryReplicaTemplate),

		tagName:  'tr',

		// The DOM events specific to an item.
		events: {

		},

		initialize: function () {
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'reset', this.render);
		},

		render: function () {
			var json = this.model.toJSON();
			var ri = this.template(json);
			this.$el.html(ri);
			this.el.id = this.model.get('shortId');
			return this;
		},

		clear: function () {
			this.model.destroy();
		}
	});
	return NodeSummaryReplicaTableView;
});
