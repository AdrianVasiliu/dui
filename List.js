define(["dcl/dcl",
	"./register",
	"dojo/_base/lang",
	"dojo/when",
	"dojo/on",
	"dojo/query",
	"dojo/dom",
	"dojo/dom-construct",
	"dojo/dom-class",
	"dojo/keys",
	"dui/Widget",
	"dui/Container",
	"dui/Selection",
	"dui/KeyNav",
	"./list/DefaultEntryRenderer",
	"./list/DefaultCategoryRenderer",
	"./list/mixins/ScrollableList"
], function (dcl, register, lang, when, on, query, dom, domConstruct, domClass, keys, Widget, Container,
		Selection, KeyNav, DefaultEntryRenderer, DefaultCategoryRenderer, ScrollableList) {

	var List = dcl([Widget, Container, Selection, ScrollableList, KeyNav], {

		/////////////////////////////////
		// Public attributes
		/////////////////////////////////

		// The ordered entries to render in the list. You can also use the dui/list/StoreModel mixin to
		// populate this list of entries using a dojo object store, in which case there is no need to
		// define a value for this attribute.
		entries: [],
		_setEntriesAttr: function (value) {
			var val = value;
			if (val && val.length) {
				if (typeof val[0] === "string") {
					var json = val.join().replace(/,/g, " ").replace(/}[\s\t]*{/g, "},{");
					if (json.match(/^[\s\t]*\[/)) {
						val = eval(json);
						// FIXME: CAN WE DO WITHOUT EVAL (USING JSON.parse ?)
						// OR SHOULD WE REMOVE THIS FEATURE FROM LIST ?
					}
				}
			}
			if (!val) {
				val = [];
			}
			this._set("entries", val);
		},

		 // Name of the list entry attribute that define the category of a list entry.
		//  If falsy, the list is not categorized.
		categoryAttribute: null,

		// The widget class to use to render list entries. It MUST extend the dui/list/AbstractEntryRenderer class.
		entriesRenderer: DefaultEntryRenderer,

		// The widget class to use to render category headers when the list entries are categorized.
		// It MUST extend the dui/list/AbstractEntryRenderer class.
		categoriesRenderer: DefaultCategoryRenderer,

		// The base class that defines the style of the list.
		// Available values are:
		// - "duiRoundRectList" (default), that render a list with rounded corners and left and right margins;
		// - "duiEdgeToEdgeList", that render a list with no rounded corners and no left and right margins.
		baseClass: "duiRoundRectList",

		// The selection mode for list entries (see dui/mixins/Selection).
		selectionMode: "none",

		/////////////////////////////////
		// Private attributes
		/////////////////////////////////

		_cssSuffixes: {entry: "-entry",
					   category: "-category",
					   selected: "-selectedEntry",
					   loading: "-loading"},
		_initialized: false,
		_entries: null,

		/////////////////////////////////
		// Widget lifecycle
		/////////////////////////////////

		preCreate: function () {
			this._entries = [];
		},

		buildRendering: function () {
			var i, len, cell;
			this.style.display = "block";
			this.dojoClick = false; // this is to avoid https://bugs.dojotoolkit.org/ticket/17578
			this.containerNode = this;
			if (this.childNodes.length > 1) {
				// reparent
				len = this.childNodes.length - 1;
				for (i = 0; i < len; i++) {
					cell = this.firstChild;
					// make sure tabIndex is -1 for keyboard navigation
					cell.tabIndex = -1;
					// TODO: CAN WE HAVE CATEGORIES HERE ???
					domClass.add(cell, this.baseClass + this._cssSuffixes.entry);
					this.containerNode.appendChild(cell);
					// TODO: IGNORE this.entries attribute in startup if entries are added using markup
				}
			}
		},

		enteredViewCallback: function () {
			// FIXME: THIS IS A WORKAROUND, BECAUSE Widget.enteredViewCallback IS RESETING THE TAB INDEX TO -1.
			// => WITH THIS WORKAROUND, ANY CUSTOM TABINDEX SET ON A WIDGET NODE IS IGNORED AND REPLACED WITH 0
			this._enteredView = true;
			this.setAttribute("tabindex", "0");
			this.tabIndex = "0";
			domClass.add(this, this.baseClass);
			// END OF WORKAROUND

			// This is not a workaround and should be defined here,
			// when we have the real initial value for this.selectionMode
			// FIXME: WHEN REMOVING THE WORKAROUND, enteredViewCallback must be a dcl.after method
			if (this.selectionMode !== "none") {
				this.on("click", lang.hitch(this, "_handleSelection"));
			}
		},

		startup: dcl.superCall(function (sup) {
			return function () {
				if (this._started) {
					return;
				}
				sup.apply(this, arguments);
				this._toggleListLoadingStyle();
				when(this._initContent(this.entries), lang.hitch(this, function () {
					this._toggleListLoadingStyle();
					this._initialized = true;
				}), function (error) {
					 // WHAT TO DO WITH THE ERROR ?
					console.log((error.message ? error.message : error) + ". See stack below.");
					console.error(error);
				});
			};
		}),

		/////////////////////////////////
		// Public methods
		/////////////////////////////////

		// Register a handler for a type of events generated in any of the list cells.
		// Parameters:
		//		event: the type of events ("click", ...)
		//		handler: the event handler
		// When the event handler is called, it receive the list as its first parameter, the event
		// as its second and the index of the list entry displayed in the cell.
		// TODO: WHAT IF THE CELL IS A CATEGORY HEADER ???
		onCellEvent: function (event, handler) {
			var that = this;
			return this.on(event, function (e) {
				var parentCell;
				if (domClass.contains(e.target, this.baseClass)) {
					return;
				} else {
					parentCell = that.getParentCell(e.target);
					if (parentCell) {
						// TODO: Pass the parentCell too ?
						// Or run the handler in the parentCell context and pass the list ?
						// TODO: Pass the parentCell INSTEAD of the entry index,
						// as it contains itself the entry index and the entry ?
						return handler.call(that, e, that.getEntryCellIndex(parentCell));
					}
				}
			});
		},

		getCellByEntry: function (entry) {
			var cells = query("." + this.baseClass + this._cssSuffixes.entry, this.containerNode);
			var cellIndex = cells.map(function (cell) {
									return cell.entry;
								})
								.indexOf(entry);
			if (cellIndex >= 0) {
				return cells[cellIndex];
			}
		},

		getEntryCellByIndex: function (index) {
			return query("." + this.baseClass + this._cssSuffixes.entry, this.containerNode)[index];
		},

		getEntryCellIndex: function (cell) {
			var index = query("." + this.baseClass + this._cssSuffixes.entry, this.containerNode).indexOf(cell);
			return index < 0 ? null : index;
		},

		getParentCell: function (node) {
			var currentNode = dom.byId(node);
			while (currentNode) {
				if (currentNode.parentNode && domClass.contains(currentNode.parentNode,
						this.baseClass)) {
					break;
				}
				currentNode = currentNode.parentNode;
			}
			if (currentNode) {
				return currentNode;
			} else {
				return null;
			}
		},

		/*jshint unused:false */
		addEntry: function (entry, index) {
			/////////////////////////////////
			// TODO: IMPLEMENT THIS
			/////////////////////////////////
		},

		addEntries: function (/*Array*/ entries, pos) {
			if (pos === "first") {
				if (this.containerNode.firstElementChild) {
					this.containerNode.insertBefore(this._createCells(entries, 0, entries.length),
							this.containerNode.firstElementChild);
				} else {
					this.containerNode.appendChild(this._createCells(entries, 0, entries.length));
				}
				this._entries = entries.concat(this._entries);
			} else if (pos === "last") {
				this.containerNode.appendChild(this._createCells(entries, 0, entries.length));
				this._entries = this._entries.concat(entries);
			} else {
				console.log("addEntries: only first and last positions are supported.");
			}
		},

		deleteEntry: function (index) {
			var cell = this.getEntryCellByIndex(index),
				nextFocusCell, entry;
			if (cell) {
				entry = cell.entry;
				// Make sure that the entry is not selected before removing it
				if (this.isSelected(entry)) {
					this.setSelected(entry, false);
				}
			}
			// Update focus if necessary
			if (this._getFocusedCell() === cell) {
				nextFocusCell = this._getNext(cell, 1) || this._getNext(cell, -1);
				if (nextFocusCell) {
					this.focusChild(nextFocusCell);
				}
			}
			// Update the model
			this._entries.splice(index, 1);
			// Then update the rendering
			if (cell) {
				this._removeCell(cell);
			}
			/////////////////////////////////////////////////////////////////////
			// TODO: IF DELETED CELL HAD FOCUS, MOVE THE FOCUS
			/////////////////////////////////////////////////////////////////////
		},

		moveEntry: function (fromIndex, toIndex) {
			/////////////////////////////////
			// TODO: IMPLEMENT THIS
			/////////////////////////////////
			console.log("TODO: move entry " + fromIndex + " to " + toIndex);
		},

		getEntriesCount: function () {
			return this._entries.length;
		},

		getEntry: function (index) {
			return this._entries[index];
		},

		/////////////////////////////////
		// Selection implementation
		/////////////////////////////////

		getIdentity: function (entry) {
			return entry;
		},

		updateRenderers: function (entries) {
			var i = 0, currentEntry, cell;
			if (this.selectionMode !== "none") {
				for (; i < entries.length; i++) {
					currentEntry = entries[i];
					cell = this.getCellByEntry(currentEntry);
					if (cell) {
						domClass.toggle(cell, "duiSelected", this.isSelected(currentEntry));
					}
				}
			}
		},

		/////////////////////////////////
		// Private methods
		/////////////////////////////////

		_initContent: function (/*Array*/ entries) {
			return this.addEntries(entries, "first");
		},

		_toggleListLoadingStyle: function () {
			domClass.toggle(this, this.baseClass + this._cssSuffixes.loading);
		},

		/////////////////////////////////
		// Private methods for cell life cycle
		/////////////////////////////////

		_createCells: function (/*Array*/ entries, fromIndex, count) {
			var currentIndex = fromIndex,
				currentEntry, toIndex = fromIndex + count - 1,
				previousEntry = fromIndex > 0 ? entries[fromIndex - 1] : null;
			var documentFragment = document.createDocumentFragment();
			for (; currentIndex <= toIndex; currentIndex++) {
				currentEntry = entries[currentIndex];
				if (this.categoryAttribute) {
					if (!previousEntry
							|| currentEntry[this.categoryAttribute] !== previousEntry[this.categoryAttribute]) {
						documentFragment.appendChild(this._createCategoryCell(currentEntry[this.categoryAttribute]));
					}
				}
				documentFragment.appendChild(this._createEntryCell(currentEntry, currentIndex));
				previousEntry = currentEntry;
			}
			return documentFragment;
		},

		_removeCell: function (cell) {
			// Update category headers before removing the cell, if necessary
			var cellIsCategoryHeader = cell._isCategoryCell,
				nextCell, previousCell;
			if (this.categoryAttribute && !cellIsCategoryHeader) {
				previousCell = this._getPreviousCell(cell);
				// remove the previous category header if necessary
				if (previousCell && previousCell._isCategoryCell) {
					nextCell = this._getNextCell(cell);
					if (!nextCell || (nextCell && nextCell._isCategoryCell)) {
						this._removeCell(previousCell);
					}
				}
			}
			// remove the cell
			cell.destroy();
		},

		_createEntryCell: function (entry, index) {
			var cell = new this.entriesRenderer({tabindex: "-1"});
			domClass.add(cell, this.baseClass + this._cssSuffixes.entry);
			cell.startup();
			cell.entry = entry;
			if (this.selectionMode !== "none") {
				domClass.toggle(cell, "duiSelected", this.isSelected(entry));
			}
			return cell;
		},

		_createCategoryCell: function (category) {
			var cell = new this.categoriesRenderer({category: category, tabindex: "-1"});
			domClass.add(cell, this.baseClass + this._cssSuffixes.category);
			cell.startup();
			return cell;
		},

		_getNextCell: function (cell) {
			return cell.nextElementSibling;
		},

		_getPreviousCell: function (cell) {
			return cell.previousElementSibling;
		},

		_getFirstCell: function () {
			var firstCell = this.getEntryCellByIndex(0);
			if (this.categoryAttribute) {
				var previousCell = null;
				if (firstCell) {
					previousCell = firstCell.previousElementSibling;
					if (previousCell && domClass.contains(previousCell, this.baseClass + this._cssSuffixes.category)) {
						firstCell = previousCell;
					}
				}
			}
			return firstCell;
		},

		_getLastCell: function () {
			var lastCell = this.getEntryCellByIndex(this.getEntriesCount() - 1);
			if (this.categoryAttribute) {
				var nextCell = null;
				if (lastCell) {
					nextCell = lastCell.nextElementSibling;
					if (nextCell && domClass.contains(nextCell, this.baseClass + this._cssSuffixes.category)) {
						lastCell = nextCell;
					}
				}
			}
			return lastCell;
		},

		/////////////////////////////////
		// Keyboard navigation (KeyNav implementation)
		/////////////////////////////////

		// Handle keydown events
		_onContainerKeydown: dcl.before(function (evt) {
			var continueProcessing = true, cell = this._getFocusedCell();
			if (cell && cell.onKeydown) {
				// onKeydown implementation can return false to cancel the default action
				continueProcessing = cell.onKeydown(evt);
			}
			if (continueProcessing !== false) {
				if ((evt.keyCode === keys.SPACE && !this._searchTimer) || evt.keyCode === keys.ENTER) {
					this._onActionKeydown(evt);
				}
			}
		}),

		// Handle SPACE and ENTER keys
		_onActionKeydown: function (evt) {
			if (this.selectionMode !== "none") {
				evt.preventDefault();
				this._handleSelection(evt);
			}
		},

		childSelector: function (child) {
			return child !== this;
		},

		_getFirst: function () {
			return this._getFirstCell();
		},

		_getLast: function () {
			return this._getLastCell();
		},

		_getNext: function (child, dir) {
			var focusedCell, refChild, returned = null;
			if (this.focusedChild) {
				focusedCell = this._getFocusedCell();
				if (focusedCell === this.focusedChild) {
					// The cell itself has the focus
					refChild = child || this.focusedChild;
					if (refChild) {
						// do not use _nextCell and _previousCell as we want to include the pageloader
						// if it exists
						returned = refChild[(dir === 1) ? "nextElementSibling" : "previousElementSibling"];
					}
				} else {
					// A descendant of the cell has the focus
					// FIXME: can it be a category header, with no _getNextFocusableChild method ?
					returned = focusedCell._getNextFocusableChild(child, dir);
				}
			} else {
				returned = (dir === 1 ? this._getFirst() : this._getLast());
			}
			return returned;
		},

		_onLeftArrow: function () {
			var nextChild;
			if (this._getFocusedCell()._getNextFocusableChild) {
				nextChild = this._getFocusedCell()._getNextFocusableChild(null, -1);
				if (nextChild) {
					this.focusChild(nextChild);
				}
			}
		},

		_onRightArrow: function () {
			var nextChild;
			if (this._getFocusedCell()._getNextFocusableChild) {
				nextChild = this._getFocusedCell()._getNextFocusableChild(null, 1);
				if (nextChild) {
					this.focusChild(nextChild);
				}
			}
		},

		_onDownArrow: function () {
			this._focusNextChild(1);
		},

		_onUpArrow: function () {
			this._focusNextChild(-1);
		},

		_focusNextChild: function (dir) {
			var child, cell = this._getFocusedCell();
			if (cell) {
				if (cell === this.focusedChild) {
					child = this._getNext(cell, dir);
					if (!child) {
						child = cell;
					}
				} else {
					child = cell;
				}
				this.focusChild(child);
			}
		},

		_getFocusedCell: function () {
			return this.focusedChild ? this.getParentCell(this.focusedChild) : null;
		},

		/////////////////////////////////
		// Other event handlers
		/////////////////////////////////

		_handleSelection: function (event) {
			var entry, entrySelected, eventCell;
			eventCell = this.getParentCell(event.target || event.srcElement);
			if (eventCell) {
				entry = eventCell.entry;
				if (entry) {
					entrySelected = !this.isSelected(entry);
					this.setSelected(entry, entrySelected);
					this.emit(entrySelected ? "entrySelected" : "entryDeselected", {entry: entry});
				}
			}
		}

	});

	return register("d-list", [HTMLElement, List]);
});