/*global define */
define(['jquery', 'underscore', 'backbone'], 				
	function($, _, Backbone) {
	'use strict';
 
	// Application Model
	// -------------------
	var AppModel = Backbone.Model.extend({
		// This model contains all of the attributes for the Application
		defaults: {
			headerType: 'default',
			//baseUrl: 'https://cn.dataone.org',
			baseUrl: 'https://www.dataone.org/cn-pass',
			nodeInfoUrl: 'https://redmine.dataone.org',
			//drupalNodeInfoListUrl: 'https://172.31.164.22/member-nodes-json',
			drupalNodeInfoListUrl: 'https://www.dataone.org/member-nodes-json',
			d1Service: '/cn/v1',
			nodeInfoService: '/issues.xml', /* Info is stored in Redmine */
			queryServiceUrl: null,
			nodeServiceUrl: null,
			nodeInfoServiceUrl: null,
			logServiceUrl : null,
			contextPrefix : '.',
			breadcrumbElementSeperator : '»',
			nodeSummaryBcEnd :  'Current Member Nodes',
			nodeSummaryBcLink : '<a href="#nodes">Current Member Nodes</a>'

		},
		
		initialize: function() {
			// these are pretty standard, but can be customized if needed
			this.set('queryServiceUrl', this.get('baseUrl') + this.get('d1Service') + '/query/solr/?');
			this.set('nodeServiceUrl', this.get('baseUrl') + this.get('d1Service') + '/node');
			this.set('logServiceUrl', this.get('baseUrl') + '/solr/d1-cn-log/select/?')
			this.set('nodeInfoServiceUrl', this.get('nodeInfoUrl') + this.get('nodeInfoService') + '?');
		}
	});
	return AppModel;			
});
