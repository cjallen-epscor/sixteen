/*global define */
define(['jquery', 'underscore', 'backbone', 'moment', 'text!templates/d1Node.html'], 				
	function($, _, Backbone, moment, D1NodeTemplate) {
	
	'use strict';

	// D1Node View
	// --------------

	// The DOM element for a SearchResult item...
	var D1NodeView = Backbone.View.extend({
		
		tagName:  'tr',
		//className: 'row-fluid result-row',

		// Cache the template function for a single item.
		template: _.template(D1NodeTemplate),

		// The DOM events specific to an item.
		events: {

		},

		// The SearchResultView listens for changes to its model, re-rendering. Since there's
		// a one-to-one correspondence between a **SolrResult** and a **SearchResultView** in this
		// app, we set a direct reference on the model for convenience.
		initialize: function () {
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'reset', this.render);
		},

		// Re-render the titles of the result item.
		render: function () {
			var json = this.model.toJSON();
			var ri = this.template(json);
			this.$el.html(ri);
			return this;
		},

		// Remove the item, destroy the model from *localStorage* and delete its view.
		clear: function () {
			this.model.destroy();
		}
	});
	return D1NodeView;
});
