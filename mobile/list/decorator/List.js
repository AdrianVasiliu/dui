define(["dojo/_base/declare",
        "dojo/string",
        "./_ListBase"
], function(declare, string, _ListBase){
	
	return declare(_ListBase, {

		/////////////////////////////////
		// Public attributes
		/////////////////////////////////

		entriesRenderer: {
			render: function(entry){
				var label = entry.label?entry.label:'???';
				var returnedHTML = '<div class="duiListEntryLabel">' + label + '</div>';
				if(entry.icon){
					returnedHTML = '<img class="duiListEntryIcon" src="' + entry.icon + '"/>' + returnedHTML;
				}
				if(entry.rightText){
					returnedHTML = '<div class="duiListEntryRightText">' + entry.rightText + '</div>' + returnedHTML;
				}
				if(entry.rightIcon2){
					returnedHTML = '<img class="duiListEntryRightIcon2" src="' + entry.rightIcon2 + '"/>' + returnedHTML;
				}
				if(entry.rightIcon){
					returnedHTML = '<img class="duiListEntryRightIcon" src="' + entry.rightIcon + '"/>' + returnedHTML;
				}
				return returnedHTML;
			}
		},

		categoriesRenderer: null, // renders the category headers when the list entries are categorized. The default one is defined in the postMixInProperties method.

		pageLoaderRenderer: { // when pageLength > 0, use this renderer to render the content of the cell that can be clicked to load one more page of entries.
			render: function(loading){
				if(loading){
					return 'Loading ${pageLength} more entries...';
				}else{
					return 'Click to load ${pageLength} more entries';
				}
			}
		},

		/////////////////////////////////
		// Widget lifecycle
		/////////////////////////////////

		postMixInProperties: function(){
			this.inherited(arguments);
			if(this.categoryAttribute){
				this.categoriesRenderer = {
						baseClass: null,
						render: function(category){
							return '<div class="' + this.baseClass + 'CategoryHeader">' + category + '</div>';
						}
				};
				this.categoriesRenderer.baseClass = this.baseClass;
			}
		},

		/////////////////////////////////
		// _ListBase implementation
		/////////////////////////////////

		_renderEntry: function(entry, entryIndex){
			return this.entriesRenderer.render(entry, entryIndex);
		},
		
		_recycleEntryRenderer: function(entryIndex){
			if(this.entriesRenderer.onCellCleanup){
				this.entriesRenderer.onCellCleanup(entryIndex);
			}
		},

		_renderCategory: function(category){
			return this.categoriesRenderer.render(category);
		},

		_recycleCategoryRenderer: function(category){
			if(this.categoriesRenderer.onCellCleanup){
				this.categoriesRenderer.onCellCleanup(category);
			}
		},

		_renderPageLoader: function(loading){
			var rendering = this.pageLoaderRenderer.render(loading);
			if(typeof rendering === 'string'){
				rendering = string.substitute(rendering, this);
			}
			return rendering;
		}

	});
});