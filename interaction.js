// Description: This file contains all functions for interaction with the user.

function initInteractions()
{
	renderer.CANVAS.append("defs").append("pattern")
		.attr("id","myPattern")
		.attr("width", 40)
		.attr("height", 40)
		.attr("patternUnits","userSpaceOnUse")
		.append("path")
		.attr("fill","none")
		.attr("stroke","#111")
		.attr("stroke-width","2")
		.attr("d","M0,40 l40,-40 M0,0 l40,40");

	// Menubar
	initMenubar();

	// Zoom and pan
	d3.select("#reddit_graph").call(
		d3.zoom()
			.scaleExtent([.01, 100])
			.on("zoom", function(event) { renderer.CANVAS.attr("transform", event.transform); })
	);

	// initialize tooltips for hovering over nodes
	initTooltip();

	// define interaction possibilities for graph svg
	setInteractions();

	// define interaction possibilities for menu bar
	setMenubarInteractions();
}

/////////////////////////////////////////////////////////////////////////////
///  Keyboard and Mouse Interactions
/////////////////////////////////////////////////////////////////////////////

function setInteractions()
{
	renderer.SVG_DRAGABLE_ELEMENTS.call(d3.drag()
		.on("start", dragStartNode)
		.on("drag", dragNode)
		.on("end", dragEndNode)
	);

	renderer.SVG_DRAGABLE_ELEMENTS
		.on("click", onMouseClick)
}

// Mouse click on node
function onMouseClick(d)
{
	d.fx = d.fy = null;
}

// Dragging nodes
function dragStartNode(event, d)
{
	event.sourceEvent.stopPropagation();
	if (!event.active)
	{
		if (!VAR_UNFREEZE)
			renderer.FORCE_SIMULATION.velocityDecay(1);	// move only one object when dragged

		renderer.FORCE_SIMULATION.alpha(VAR_ALPHA).restart();
	}
	d.fx = d.x;
	d.fy = d.y;

	if (VAR_SHOW_TOOLTIPS_NODES)
		d3.select("#tooltip").style("opacity", VAR_TOOLTIP_DRAG_OPACITY);
}

function dragNode(event, d)
{
	d.fx = event.x;
	d.fy = event.y;

	if (VAR_SHOW_TOOLTIPS_NODES)
		d3.select("#tooltip")
			.style("top", (event.sourceEvent.pageY - 10) + "px")
			.style("left", (event.sourceEvent.pageX + 15) + "px");
}

function toggleEnergizeSimulation()
{
	VAR_UNFREEZE = !VAR_UNFREEZE;
	if (VAR_UNFREEZE) {
		renderer.restartSimulation();
	}
	else {
		renderer.stopSimulation();
	}
}

function dragEndNode(event, d)
{
	if (!event.active && !VAR_UNFREEZE)
		renderer.FORCE_SIMULATION.velocityDecay(VAR_FRICTION).alpha(0);	// reset friction

	if (VAR_SHOW_TOOLTIPS_NODES)
		d3.select("#tooltip").style("opacity", 1.0);
}

// Show/hide links
function toggleLinks()
{
	VAR_SHOW_LINKS = !VAR_SHOW_LINKS;
	renderer.updateLinkDisplay();
}

// Show/hide graph
function toggleShowGraph()
{
	VAR_SHOW_GRAPH = !VAR_SHOW_GRAPH;
	renderer.GRAPH_LAYER.attr("visibility", VAR_SHOW_GRAPH ? "visible" : "hidden");
}

// Show/hide names (nicknames)
function toggleNames()
{
	VAR_SHOW_NAMES = !VAR_SHOW_NAMES;
	if (VAR_SHOW_NAMES)
		renderer.showNames();
	else
		renderer.hideNames();
}

// Show/hide node info
function toggleShowTooltips()
{
	VAR_SHOW_TOOLTIPS_NODES = !VAR_SHOW_TOOLTIPS_NODES;
	registerTooltipEventhandler();
}

function setClusterType(type)
{
	VAR_CLUSTER_BY = type;
	renderer.restartSimulation();
}

function forceClusters(){
	VAR_FORCE_CLUSTERS = !VAR_FORCE_CLUSTERS;
	renderer.restartSimulation();
}
// Change color of nodes depending on toxicity
function toggleColorMap()
{
	VAR_SET_COLORMAP_NODES = !VAR_SET_COLORMAP_NODES;
	renderer.updateColorMap();
}

// Create a color based on toxicity
function getRGBColour(value)
{
	color = VAR_INTERPOLATOR(value).toString();
	return color;
}


function updateClusterInformation()
{
	const cluster = renderer.FORCE_SIMULATION.force("cluster").cluster();
	const container = d3.select('#cluster-information');

	if (cluster) {

		const entries = [...cluster.entries()].sort(([keyA, itemsA], [keyB, itemsB]) => {
			return itemsB.length - itemsA.length;
		})

		const nodes = entries.reduce((sum, [key, values]) => sum + values.length, 0);

		const html = [
			`<h3>${cluster.size} Cluster</h3>`,
			`<div>${nodes} Nodes</div>`,
			'<table><tbody>',
			...entries.map(buildClusterInformation),
			'</tbody></table>'
		];

		container.html(html.join(''));
	} else {
		container.text("");
	}

}

function buildClusterInformation([key, values])
{
	const [min, max] = values.reduce(([min, max], node) => {
		const value = getNodeValue(node, VAR_CLUSTER_BY);

		return [
			Math.min(min, value),
			Math.max(max, value)
		];
	}, [99999999999, 0])

	return `<tr><td>${values.length}</td><td>${min.toFixed(4)}</td><td>${max.toFixed(4)}</td></tr>`;
}

/////////////////////////////////////////////////////////////////////////////
///  MENUBAR INTERACTIONS

function initMenubar()
{
	d3.select("#menu_noderadius").property("value", VAR_NODE_RADIUS);
	d3.select("#menu_linkwidth").property("value", VAR_LINK_WIDTH);
	d3.select("#menu_pnodeopacity").property("value", VAR_USER_LABEL_OPACITY);

	// Interaction
	d3.select("#menu_freeze").property('checked', !VAR_UNFREEZE);
	d3.select("#menu_enable_colormap").property('checked', VAR_SET_COLORMAP_NODES);
	d3.select("#menu_show_tooltips").property('checked', VAR_SHOW_TOOLTIPS_NODES);

	d3.select("#menu_set_clusters").property('checked', VAR_FORCE_CLUSTERS);

	// Force Simulation
	d3.select("#menu_repulsion_strength").property("value", VAR_REPULSION_STRENGTH);
	d3.select("#menu_gravity_x").property('value', VAR_GRAVITY_X);
	d3.select("#menu_gravity_y").property('value', VAR_GRAVITY_Y);
	d3.select("#menu_link_strength").property("value", VAR_LINK_STRENGTH);
	d3.select("#menu_friction").property("value", VAR_FRICTION);

	// Appearance
	d3.select("#menu_show_graph").property("checked", VAR_SHOW_GRAPH);
    d3.select("#menu_show_links").property("checked", VAR_SHOW_LINKS);
	d3.select("#menu_show_names").property("checked", VAR_SHOW_NAMES);

	// Interactive features
	d3.select("#menu_show_tooltips").property("checked", VAR_SHOW_TOOLTIPS_NODES);
}

function setMenubarInteractions()
{
	d3.select("#menu_noderadius").on("input", function() {
		VAR_NODE_RADIUS = parseInt(this.value);
		updateNodeRadius();
	});
	d3.select("#menu_linkdist").on("input", function() {
		VAR_LINK_DISTANCE = parseInt(this.value);
	});

	d3.select("#menu_linkwidth").on("input", function() {
		VAR_LINK_WIDTH = parseInt(this.value);
		if (renderer.SVG_LINKS)	renderer.SVG_LINKS.attr("stroke-width", VAR_LINK_WIDTH + "px");
	});
	d3.select("#menu_pnodeopacity").on("input", function() {
		VAR_USER_LABEL_OPACITY = parseFloat(this.value);
		if (renderer.SVG_NODE_LABELS) renderer.SVG_NODE_LABELS.style("opacity", VAR_USER_LABEL_OPACITY);
	});
	d3.select("#menu_repulsion_strength").on("input", function() {
		VAR_REPULSION_STRENGTH = this.value;
		renderer.REPULSION_FORCE.strength(-VAR_REPULSION_STRENGTH);
	});
	d3.select("#menu_link_strength").on("input", function() {
		VAR_LINK_STRENGTH = this.value;
		renderer.LINK_FORCE.strength(VAR_LINK_STRENGTH);
	});
	d3.select("#menu_friction").on("input", function() {
		VAR_FRICTION = parseFloat(this.value);
		renderer.FORCE_SIMULATION.velocityDecay(VAR_FRICTION);
	});
	d3.select("#menu_gravity_x").on("input", function() {
		VAR_GRAVITY_X = parseFloat(this.value);
		renderer.FORCE_SIMULATION.force("x", d3.forceX(0).strength(VAR_GRAVITY_X))
	});
	d3.select("#menu_gravity_y").on("input", function() {
		VAR_GRAVITY_Y = parseFloat(this.value);
		renderer.FORCE_SIMULATION.force("y", d3.forceY(0).strength(VAR_GRAVITY_Y))
	});
	d3.select("#menu_show_names").on("input", function() {
		toggleNames();
	});
	d3.select("#menu_show_graph").on("input", function() {
		toggleShowGraph();
	});
	d3.select("#menu_show_links").on("input", function() {
		toggleLinks();
	});
	d3.select("#menu_enable_colormap").on("click", function(e){
		toggleColorMap();
	});
	d3.select("#menu_freeze").on("click", function (e) {
		toggleEnergizeSimulation();
	});
	d3.select("#menu_show_tooltips").on("click", function (e) {
		toggleShowTooltips();
	});
	d3.select("#menu_set_clusters").on("click", function (e) {
		forceClusters();
		d3.select("#menu_link_strength").property("disabled", VAR_FORCE_CLUSTERS);
	});
	d3.select("#menu_cluster_type").on("change", function (e) {
		setClusterType(e.target.value);
	});


	d3.selectAll(".input-on-change").on("change", function (e) {
		let value = e.target.value;

		switch (e.target.getAttribute("name")) {
			case 'node_color_start':
				VAR_NODE_START_COLOR = value;
				VAR_INTERPOLATOR_NODES = d3.interpolateRgb(VAR_NODE_START_COLOR, VAR_NODE_END_COLOR);
				renderer.updateColorMap();
				break;
			case 'node_color_end':
				VAR_NODE_END_COLOR = value;
				VAR_INTERPOLATOR_NODES = d3.interpolateRgb(VAR_NODE_START_COLOR, VAR_NODE_END_COLOR);
				renderer.updateColorMap();
				break;

			case 'edge_color_start':
				VAR_EDGE_START_COLOR = value;
				VAR_INTERPOLATOR_EDGES = d3.interpolateRgb(VAR_EDGE_START_COLOR, VAR_EDGE_END_COLOR);
				renderer.updateColorMap();
				break;
			case 'edge_color_end':
				VAR_EDGE_END_COLOR = value;
				VAR_INTERPOLATOR_EDGES = d3.interpolateRgb(VAR_EDGE_START_COLOR, VAR_EDGE_END_COLOR);
				renderer.updateColorMap();
				break;

			case 'colorize_edges_by':
				VAR_EDGE_COLOR_BY = value;
				renderer.updateColorMap();
				break;

			case 'colorize_nodes_by':
				VAR_NODE_COLOR_BY = value;
				renderer.updateColorMap();
				break;

			case 'size_nodes_by':
				VAR_NODE_SIZE_MODIFIER = value;
				updateNodeRadius();
				break;

			case 'filter_edges_by':
				VAR_EDGE_FILTER = value;
				if (value === "nofilter") {
					VAR_EDGE_FILTER_RANGE = [0, 1];
				}
				renderer.updateLinkDisplay();
				break;
			case 'filter_edges_min':
				value = parseFloat(value);
				VAR_EDGE_FILTER_RANGE[0] = parseFloat(value);
				renderer.updateLinkDisplay();
				break;
			case 'filter_edges_max':
				VAR_EDGE_FILTER_RANGE[1] = parseFloat(value);
				renderer.updateLinkDisplay();
				break;

			case 'max_clusters':
				VAR_MAX_CLUSTERS = value
				renderer.restartSimulation();
				break;
		}
	});
}

function initTooltip()
{
	d3.select("#tooltip").remove(); // remove any previous elements
	d3.select("body").append("div").attr("id", "tooltip");
	registerTooltipEventhandler();
}

function registerTooltipEventhandler()
{
	if (VAR_SHOW_TOOLTIPS_NODES) {
		let tooltip = d3.select("#tooltip");

		renderer.SVG_DRAGABLE_ELEMENTS
			.on("mouseover", function (event, node) {
				return tooltip.style("visibility", "visible");
			})
			.on("mouseenter", function (event, node) { // insert tooltip content
				let tooltipString = renderer.getNodeAttributesAsString(node);
				return tooltip.text(tooltipString);
			})
			.on("mousemove", function (event) { // adjust tooltip position
				return tooltip
					.style("top", (event.pageY - 10) + "px")
					.style("left", (event.pageX + 15) + "px");
			})
			.on("mouseout", function () {
				return tooltip.style("visibility", "hidden");
			});

		renderer.SVG_LINKS
			.on("mouseover", function (event, link) {
				if (VAR_SHOW_LINKS && event.target.getAttribute("opacity") !== "0") {
					tooltip.style("visibility", "visible");
				}
			})
			.on("mouseenter", function (event, link) {

				if (VAR_SHOW_LINKS && event.target.getAttribute("opacity") !== "0") {
					let tooltipString = renderer.getLinkAttributesAsString(link);
					return tooltip.text(tooltipString);
				}
			})
			.on("mousemove", function (event) {
				if (VAR_SHOW_LINKS && event.target.getAttribute("opacity") !== "0") {
					return tooltip
						.style("top", (event.pageY - 10) + "px")
						.style("left", (event.pageX + 15) + "px");
				}

			})
			.on("mouseout", function () {
				if (VAR_SHOW_LINKS && event.target.getAttribute("opacity") !== "0") {
					return tooltip.style("visibility", "hidden");
				}
			});
	} else {
		renderer.SVG_DRAGABLE_ELEMENTS
			.on("mouseover", null)
			.on("mouseenter", null)
			.on("mousemove", null)
			.on("mouseout", null)
		;
		renderer.SVG_LINKS
			.on("mouseover", null)
			.on("mouseenter", null)
			.on("mousemove", null)
			.on("mouseout", null)
		;
		d3.select("#tooltip").style("visibility", "hidden");
	}
}


// Parameter menu is update
function setDefaultParameters()
{
	// Menu "Interaction"
	VAR_UNFREEZE = true;
	VAR_USE_MOUSEOVER = false;
	VAR_SHOW_TOOLTIPS_NODES = false;

	// Menu "Force Layout"
	VAR_GRAVITY_X = 0.07;
	VAR_GRAVITY_Y = 0.07;
	VAR_REPULSION_STRENGTH = 400;
	VAR_LINK_STRENGTH = 1.8;
	VAR_FRICTION = 0.2;

	// Menu "Graph Appearance"
	VAR_SHOW_GRAPH = true;
	VAR_SHOW_LINKS = true;
	VAR_SHOW_NAMES = false;
	VAR_LINK_WIDTH = 4;
	VAR_NODE_RADIUS = 30;
	VAR_USER_LABEL_OPACITY = 0.7;
	VAR_SET_COLORMAP_NODES = true;

	VAR_FORCE_CLUSTERS = true;

	// Without menu entry
	VAR_ARROW_RADIUS = 10;

	initMenubar(); // update visuals based on parameter values
}
