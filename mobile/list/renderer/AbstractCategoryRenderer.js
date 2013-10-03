define(["dojo/_base/declare",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dui/_WidgetBase"
], function(declare, domClass, domConstruct, _WidgetBase){

	return declare([_WidgetBase], {

		// The category to render
		category: null,
		_setCategoryAttr: function(value){
			this._set('category', value);
			this.renderCategory(value);
		},

		buildRendering: function(){
			if(!this.domNode){
				this.domNode = domConstruct.create('li');
			}
			domClass.add(this.domNode, 'duiListCategoryHeader');
			this.inherited(arguments);
		},

		// Method that render the category in the widget GUI
		renderCategory: function(category){
			// abstract method
			// this.category = category;
		}

	});
});