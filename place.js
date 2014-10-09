/**
 * Place an Element relative to a point, rectangle, or another Element.
 * @module delite/place
 */
define([
	"./Viewport" // getEffectiveBox
], function (Viewport) {

	/**
	 * @typedef {Object} module:delite/place.Position
	 * @property {number} x - Horizontal coordinate in pixels, relative to document body.
	 * @property {number} y - Vertical coordinate in pixels, relative to document body.
	 */

	/**
	 * Represents the position of the "anchor" node.   Popup node will be placed adjacent to this rectangle.
	 * @typedef {Object} module:delite/place.Rectangle
	 * @property {number} x - Horizontal coordinate in pixels, relative to document body.
	 * @property {number} y - Vertical coordinate in pixels, relative to document body.
	 * @property {number} w - Width in pixels.
	 * @property {number} h - Height in pixels.
	 */

	/**
	 * Function on popup widget to adjust it based on what position it's being displayed in,
	 * relative to anchor node.
	 * @callback module:delite/place.LayoutFunc
	 * @param {Element} node - The DOM node for the popup widget.
	 * @param {string} aroundCorner - Corner of the anchor node, one of:
	 * - "BL" - bottom left
	 * - "BR" - bottom right
	 * - "TL" - top left
	 * - "TR" - top right
	 * @param {string} nodeCorner - Corner of the popup node, one of:
	 * - "BL" - bottom left
	 * - "BR" - bottom right
	 * - "TL" - top left
	 * - "TR" - top right
	 * @param {Object} size - `{w: 20, h: 30}` type object specifying size of the popup.
	 * @returns {number} Optional.  Amount that the popup needed to be modified to fit in the space provided.
	 * If no value is returned, it's assumed that the popup fit completely without modification.
	 */

	/**
	 * Meta-data about the position chosen for a popup node.
	 * Specifies the corner of the anchor node and the corner of the popup node that touch each other,
	 * plus sizing data.
	 * @typedef {Object} module:delite/place.ChosenPosition
	 * @property {string} aroundCorner - Corner of the anchor node:
	 * - "BL" - bottom left
	 * - "BR" - bottom right
	 * - "TL" - top left
	 * - "TR" - top right
	 * @property {string} corner - Corner of the popup node:
	 * - "BL" - bottom left
	 * - "BR" - bottom right
	 * - "TL" - top left
	 * - "TR" - top right
	 * @property {number} x - Horizontal position of popup in pixels, relative to document body.
	 * @property {number} y - Vertical position of popup in pixels, relative to document body.
	 * @property {number} w - Width of popup in pixels.
	 * @property {number} h - Height of popup in pixels.
	 * @property {Object} spaceAvailable - `{w: 30, h: 20}` type object listing the amount of space that
	 * was available fot the popup in the chosen position.
	 */

	/**
	 * Given a list of positions to place node, place it at the first position where it fits,
	 * of if it doesn't fit anywhere then the position with the least overflow.
	 * @param {Element} node
	 * @param {Array} choices - Array of objects like `{corner: "TL", pos: {x: 10, y: 20} }`.
	 * This example says to put the top-left corner of the node at (10,20).
	 * @param {module:delite/place.LayoutFunc} [layoutNode] - Widgets like tooltips are displayed differently an
	 * have different dimensions based on their orientation relative to the parent.
	 * This adjusts the popup based on orientation.
	 * It also passes in the available size for the popup, which is useful for tooltips to
	 * tell them that their width is limited to a certain amount.  layoutNode() may return a value
	 * expressing how much the popup had to be modified to fit into the available space.
	 * This is used to determine what the best placement is.
	 * @param {module:delite/place.Rectangle} aroundNodeCoords - Size and position of aroundNode.
	 * @returns {module:delite/place.ChosenPosition} Best position to place node.
	 * @private
	 */
	function _placeAt(node, choices, layoutNode, aroundNodeCoords) {
		// get {l: 10, t: 10, w: 100, h:100} type obj representing position of
		// viewport over document
		var view = Viewport.getEffectiveBox(node.ownerDocument);

		// This won't work if the node is inside a <div style="position: relative">,
		// so reattach it to <body>.	 (Otherwise, the positioning will be wrong
		// and also it might get cut off.)
		if (!node.parentNode || String(node.parentNode.tagName).toLowerCase() !== "body") {
			node.ownerDocument.body.appendChild(node);
		}

		var best = null;
		choices.some(function (choice) {
			var corner = choice.corner;
			var pos = choice.pos;
			var overflow = 0;

			// calculate amount of space available given specified position of node
			var spaceAvailable = {
				w: {
					"L": view.l + view.w - pos.x,
					"R": pos.x - view.l,
					"M": view.w
				}[corner.charAt(1)],
				h: {
					"T": view.t + view.h - pos.y,
					"B": pos.y - view.t,
					"M": view.h
				}[corner.charAt(0)]
			};

			// Clear left/right position settings set earlier so they don't interfere with calculations,
			// specifically when layoutNode() (a.k.a. Tooltip.orient()) measures natural width of Tooltip
			var s = node.style;
			s.left = s.right = "auto";

			// configure node to be displayed in given position relative to button
			// (need to do this in order to get an accurate size for the node, because
			// a tooltip's size changes based on position, due to triangle)
			if (layoutNode) {
				var res = layoutNode(node, choice.aroundCorner, corner, spaceAvailable, aroundNodeCoords);
				overflow = typeof res === "undefined" ? 0 : res;
			}

			// get node's size
			var style = node.style;
			var oldDisplay = style.display;
			var oldVis = style.visibility;
			if (style.display === "none") {
				style.visibility = "hidden";
				style.display = "";
			}
			var bb = node.getBoundingClientRect();
			style.display = oldDisplay;
			style.visibility = oldVis;

			// coordinates and size of node with specified corner placed at pos,
			// and clipped by viewport
			var
				startXpos = {
					"L": pos.x,
					"R": pos.x - bb.width,
					// M orientation is more flexible
					"M": Math.max(view.l, Math.min(view.l + view.w, pos.x + (bb.width >> 1)) - bb.width)
				}[corner.charAt(1)],
				startYpos = {
					"T": pos.y,
					"B": pos.y - bb.height,
					"M": Math.max(view.t, Math.min(view.t + view.h, pos.y + (bb.height >> 1)) - bb.height)
				}[corner.charAt(0)],
				startX = Math.max(view.l, startXpos),
				startY = Math.max(view.t, startYpos),
				endX = Math.min(view.l + view.w, startXpos + bb.width),
				endY = Math.min(view.t + view.h, startYpos + bb.height),
				width = endX - startX,
				height = endY - startY;

			overflow += (bb.width - width) + (bb.height - height);

			if (best == null || overflow < best.overflow) {
				best = {
					corner: corner,
					aroundCorner: choice.aroundCorner,
					x: startX,
					y: startY,
					w: width,
					h: height,
					overflow: overflow,
					spaceAvailable: spaceAvailable
				};
			}

			return !overflow;
		});

		// In case the best position is not the last one we checked, need to call
		// layoutNode() again.
		if (best.overflow && layoutNode) {
			layoutNode(node, best.aroundCorner, best.corner, best.spaceAvailable, aroundNodeCoords);
		}

		// And then position the node.  Do this last, after the layoutNode() above
		// has sized the node, due to browser quirks when the viewport is scrolled
		// (specifically that a Tooltip will shrink to fit as though the window was
		// scrolled to the left).

		var top = best.y,
			side = best.x,
			cs = getComputedStyle(node.ownerDocument.body);

		if (/^(relative|absolute)$/.test(cs.position)) {
			// compensate for margin on <body>, see #16148
			top -= cs.marginTop;
			side -= cs.marginLeft;
		}

		var s = node.style;
		s.top = top + "px";
		s.left = side + "px";
		s.right = "auto";	// needed for FF or else tooltip goes to far left

		return best;
	}

	var reverse = {
		// Map from corner to kitty-corner
		"TL": "BR",
		"TR": "BL",
		"BL": "TR",
		"BR": "TL"
	};

	var place = /** @lends module:delite/place */ {

		// TODO: it's weird that padding is specified as x/y rather than h/w.

		/**
		 * Positions node kitty-corner to the rectangle centered at (pos.x, pos.y) with width and height of
		 * padding.x * 2 and padding.y * 2, or zero if padding not specified.  Picks first corner in
		 * corners[] where node is fully visible, or the corner where it's most visible.
		 *
		 * Node is assumed to be absolutely or relatively positioned.
		 * 
		 * @param {Element} node - The popup node to be positioned.
		 * @param {module:delite/place.Position} pos - The point (or if padding specified, rectangle) to place
		 * the node kitty-corner to.
		 * @param {string[]} corners - Array of strings representing order to try corners of the node in,
		 * like `["TR", "BL"]`.  Possible values are:
		 * - "BL" - bottom left
		 * - "BR" - bottom right
		 * - "TL" - top left
		 * - "TR" - top right
		 * @param {module:delite/place.Position} [padding] - Optional param to set padding, to put some buffer
		 * around the element you want to position.  Defaults to zero.
		 * @param {module:delite/place.LayoutFunc} [layoutNode]
		 * @returns {module:delite/place.ChosenPosition} Position node was placed at.
		 * @example
		 * // Try to place node's top right corner at (10,20).
		 * // If that makes node go (partially) off screen, then try placing
		 * // bottom left corner at (10,20).
		 * place.at(node, {x: 10, y: 20}, ["TR", "BL"])
		 */
		at: function (node, pos, corners, padding, layoutNode) {
			var choices = corners.map(function (corner) {
				var c = {
					corner: corner,
					aroundCorner: reverse[corner],	// so TooltipDialog.orient() gets aroundCorner argument set
					pos: {x: pos.x, y: pos.y}
				};
				if (padding) {
					c.pos.x += corner.charAt(1) === "L" ? padding.x : -padding.x;
					c.pos.y += corner.charAt(0) === "T" ? padding.y : -padding.y;
				}
				return c;
			});

			return _placeAt(node, choices, layoutNode);
		},

		/**
		 * Position node adjacent to anchor such that it's fully visible in viewport.
		 * Adjacent means that one side of the anchor is flush with one side of the node.
		 * @param {Element} node - The popup node to be positioned.
		 * @param {Element|module:delite/place.Rectangle} anchor - Place node adjacent to this Element or rectangle.
		 * @param {string[]} positions - Ordered list of positions to try matching up.
		 * - before: places drop down to the left of the anchor node/widget, or to the right in the case
		 *   of RTL scripts like Hebrew and Arabic; aligns either the top of the drop down
		 *   with the top of the anchor, or the bottom of the drop down with bottom of the anchor.
		 * - after: places drop down to the right of the anchor node/widget, or to the left in the case
		 *   of RTL scripts like Hebrew and Arabic; aligns either the top of the drop down
		 *   with the top of the anchor, or the bottom of the drop down with bottom of the anchor.
		 * - before-centered: centers drop down to the left of the anchor node/widget, or to the right
		 *   in the case of RTL scripts like Hebrew and Arabic
		 * - after-centered: centers drop down to the right of the anchor node/widget, or to the left
		 *   in the case of RTL scripts like Hebrew and Arabic
		 * - above-centered: drop down is centered above anchor node
		 * - above: drop down goes above anchor node, left sides aligned
		 * - above-alt: drop down goes above anchor node, right sides aligned
		 * - below-centered: drop down is centered above anchor node
		 * - below: drop down goes below anchor node
		 * - below-alt: drop down goes below anchor node, right sides aligned
		 * @param {boolean} leftToRight - True if widget is LTR, false if widget is RTL.
		 * Affects the behavior of "above" and "below" positions slightly.
		 * @param {module:delite/place.LayoutFunc} [layoutNode] - Widgets like tooltips are displayed differently and
		 * have different dimensions based on their orientation relative to the parent.
		 * This adjusts the popup based on orientation.
		 * @returns {module:delite/place.ChosenPosition} Position node was placed at.
		 * @example
		 * // Try to position node such that node's top-left corner is at the same position
		 * // as the bottom left corner of the aroundNode (ie, put node below
		 * // aroundNode, with left edges aligned).	If that fails try to put
		 * // the bottom-right corner of node where the top right corner of aroundNode is
		 * // (i.e., put node above aroundNode, with right edges aligned)
		 * place.around(node, aroundNode, {'BL':'TL', 'TR':'BR'});
		 */
		around: function (node, anchor, positions, leftToRight, layoutNode) {
			/* jshint maxcomplexity:12 */

			// If around is a DOMNode (or DOMNode id), convert to coordinates.
			var aroundNodePos;
			if (typeof anchor === "string" || "offsetWidth" in anchor || "ownerSVGElement" in anchor) {
				aroundNodePos = place.position(anchor);

				// For above and below dropdowns, subtract width of border so that popup and aroundNode borders
				// overlap, preventing a double-border effect.  Unfortunately, difficult to measure the border
				// width of either anchor or popup because in both cases the border may be on an inner node.
				if (/^(above|below)/.test(positions[0])) {
					var border = function (node) {
						var cs = getComputedStyle(node);
						return {
							t: parseFloat(cs.borderTopWidth),	// remove "px"
							b: parseFloat(cs.borderBottomWidth)	// remove "px"
						};
					};
					var anchorBorder = border(anchor),
						anchorChildBorder = anchor.firstElementChild ? border(anchor.firstElementChild) : {t: 0, b: 0},
						nodeBorder = border(node),
						nodeChildBorder = node.firstElementChild ? border(node.firstElementChild) : {t: 0, b: 0};
					aroundNodePos.y += Math.min(anchorBorder.t + anchorChildBorder.t,
						nodeBorder.t + nodeChildBorder.t);
					aroundNodePos.h -= Math.min(anchorBorder.t + anchorChildBorder.t,
						nodeBorder.t + nodeChildBorder.t) +
						Math.min(anchorBorder.b + anchorChildBorder.b, nodeBorder.b + nodeChildBorder.b);
				}
			} else {
				aroundNodePos = anchor;
			}

			// Compute position and size of visible part of anchor (it may be partially hidden by ancestor
			// nodes w/scrollbars)
			if (anchor.parentNode) {
				// ignore nodes between position:relative and position:absolute
				var sawPosAbsolute = getComputedStyle(anchor).position === "absolute";
				var parent = anchor.parentNode;
				// ignoring the body will help performance
				while (parent && parent.nodeType === 1 && parent.nodeName !== "BODY") {
					var parentPos = place.position(parent),
						pcs = getComputedStyle(parent);
					if (/^(relative|absolute)$/.test(pcs.position)) {
						sawPosAbsolute = false;
					}
					if (!sawPosAbsolute && /^(hidden|auto|scroll)$/.test(pcs.overflow)) {
						var bottomYCoord = Math.min(aroundNodePos.y + aroundNodePos.h, parentPos.y + parentPos.h);
						var rightXCoord = Math.min(aroundNodePos.x + aroundNodePos.w, parentPos.x + parentPos.w);
						aroundNodePos.x = Math.max(aroundNodePos.x, parentPos.x);
						aroundNodePos.y = Math.max(aroundNodePos.y, parentPos.y);
						aroundNodePos.h = bottomYCoord - aroundNodePos.y;
						aroundNodePos.w = rightXCoord - aroundNodePos.x;
					}
					if (pcs.position === "absolute") {
						sawPosAbsolute = true;
					}
					parent = parent.parentNode;
				}
			}

			var x = aroundNodePos.x,
				y = aroundNodePos.y,
				width = aroundNodePos.w,
				height = aroundNodePos.h;

			// Convert positions arguments into choices argument for _placeAt()
			var choices = [];

			function push(aroundCorner, corner) {
				choices.push({
					aroundCorner: aroundCorner,
					corner: corner,
					pos: {
						x: {
							"L": x,
							"R": x + width,
							"M": x + (width >> 1)
						}[aroundCorner.charAt(1)],
						y: {
							"T": y,
							"B": y + height,
							"M": y + (height >> 1)
						}[aroundCorner.charAt(0)]
					}
				});
			}

			positions.forEach(function (pos) {
				/* jshint maxcomplexity:25 */	// TODO: rewrite to avoid 25 max complexity
				var ltr = leftToRight;
				switch (pos) {
				case "above-centered":
					push("TM", "BM");
					break;
				case "below-centered":
					push("BM", "TM");
					break;
				case "after-centered":
					ltr = !ltr;
					/* falls through */
				case "before-centered":
					push(ltr ? "ML" : "MR", ltr ? "MR" : "ML");
					break;
				case "after":
					ltr = !ltr;
					/* falls through */
				case "before":
					push(ltr ? "TL" : "TR", ltr ? "TR" : "TL");
					push(ltr ? "BL" : "BR", ltr ? "BR" : "BL");
					break;
				case "below-alt":
					ltr = !ltr;
					/* falls through */
				case "below":
					// first try to align left borders, next try to align right borders (or reverse for RTL mode)
					push(ltr ? "BL" : "BR", ltr ? "TL" : "TR");
					push(ltr ? "BR" : "BL", ltr ? "TR" : "TL");
					break;
				case "above-alt":
					ltr = !ltr;
					/* falls through */
				case "above":
					// first try to align left borders, next try to align right borders (or reverse for RTL mode)
					push(ltr ? "TL" : "TR", ltr ? "BL" : "BR");
					push(ltr ? "TR" : "TL", ltr ? "BR" : "BL");
					break;
				}
			});

			var position = _placeAt(node, choices, layoutNode, {w: width, h: height});
			position.aroundNodePos = aroundNodePos;

			return position;
		},

		/**
		 * Centers the specified node, like a Dialog.
		 * Node must fit within viewport.
		 *
		 * Node is assumed to be absolutely or relatively positioned.
		 *
		 * @param {Element} node - The popup node to be positioned.
		 */
		center: function (node) {
			var view = Viewport.getEffectiveBox(node.ownerDocument),
				bb = node.getBoundingClientRect();
			node.style.position = "fixed";
			node.style.top = (view.h - bb.height) / 2 + "px";
			node.style.left = (view.w - bb.width) / 2 + "px";
		},

		/**
		 * Return node position relative to document (rather than to viewport)
		 * @param node
		 */
		position: function (node) {
			var bcr = node.getBoundingClientRect(),
				doc = node.ownerDocument,
				win = doc.defaultView;
			return {
				x: bcr.left + (win.pageXOffset || doc.documentElement.scrollLeft),
				y: bcr.top + (win.pageYOffset || doc.documentElement.scrollTop),
				h: bcr.height,
				w: bcr.width
			};
		}
	};

	return place;
});
