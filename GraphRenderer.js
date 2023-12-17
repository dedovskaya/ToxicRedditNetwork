///PARAMETERS
const VAR_MAX_TOXICITY = 1.0;
const VAR_MIN_TOXICITY = -1.0;

// Force Graph
var VAR_ALPHA = 1;
var VAR_GRAVITY_X = 0.06;
var VAR_GRAVITY_Y = 0.06;
var VAR_REPULSION_STRENGTH = 400;
var VAR_LINK_STRENGTH = 0.8;
var VAR_FRICTION = 0.4;
var VAR_FORCE_CLUSTERS = true;

// Graph appearance
var VAR_NODE_COLOR = "blue";

var VAR_NODE_START_COLOR = "rgb(86, 252, 3)";
var VAR_NODE_END_COLOR = "#ff0000";

var VAR_EDGE_START_COLOR = "rgb(86, 252, 3)";
var VAR_EDGE_END_COLOR = "#ff0000";

var VAR_NODE_COLOR_BY = "toxicity";
var VAR_EDGE_COLOR_BY = "toxicity";

var VAR_NODE_SIZE_MODIFIER = "samesize";

var VAR_NODE_RADIUS = 30;
var VAR_FONT_SIZE = 20;
var VAR_LINK_DISTANCE = 8 * VAR_NODE_RADIUS;
var VAR_LINK_WIDTH = 4;
var VAR_LINK_OPACITY = 1;
var VAR_ARROW_RADIUS = 14;
var VAR_LABEL_COLOR = "black";
var VAR_LINK_COLOR = "black";
var VAR_USER_LABEL_OPACITY = 0.7;

var VAR_EDGE_FILTER = "nofilter";
var VAR_EDGE_FILTER_RANGE = [0, 1];

var VAR_MAX_CLUSTERS = 0;

// Scalarfield Appearance

var VAR_INTERPOLATOR_NODES = d3.interpolateRgb(VAR_NODE_START_COLOR, VAR_NODE_END_COLOR);
var VAR_INTERPOLATOR_EDGES = d3.interpolateRgb(VAR_EDGE_START_COLOR, VAR_EDGE_END_COLOR);

var VAR_USE_MOUSEOVER = false;
var VAR_SHOW_GRAPH = true;
var VAR_SHOW_LINKS = true;
var VAR_SHOW_NAMES = false;
var VAR_USER_LABELS_BELOW_NODE = true;
var VAR_UNFREEZE = true;
var VAR_ARROW_DISTANCE_FACTOR = 1.0;

// Tooltips
var VAR_SHOW_TOOLTIPS_NODES = false;
var VAR_SET_COLORMAP_NODES = true;
var VAR_TOOLTIP_DRAG_OPACITY = 0.5;

//Clustering by
var VAR_CLUSTER_BY = "toxicity";

class GraphRenderer
{
	constructor()
	{
		// Graphic Layers
		this.CANVAS;
		this.GRAPH_LAYER;

		// SVG Elements
		this.SVG_NODE_CIRCLES;
		this.SVG_LINKS;
		this.SVG_NODE_LABELS;
		this.SVG_DRAGABLE_ELEMENTS;

		// Data and Variables
		this.NODES = [];
		this.LINKS = [];
		this.tickCounter = 0;
		this.FORCE_SIMULATION;
		this.REPULSION_FORCE;
		this.LINK_FORCE;

        // reate SVG layer
        this.initSVGLayers();
	}

	createForceGraphJSON(json)
	{
		var nodeMap = new Map();
		Object.values(json.nodes).forEach(node =>
		{
			node.r = VAR_NODE_RADIUS;
			if (node.value == 0) {
				node.value = 0.001
			}

			if (node.fixed) {
				node.fx = node.x;
				node.fy = node.y;
            }

			nodeMap.set(node.id, node);

			this.NODES.push(node);
		});

		// Set source and target of links
		Object.values(json.links).forEach(link => {
			var source = nodeMap.get(link.source);
			var target = nodeMap.get(link.target);

			if (!source) {
				console.log("Source " + link.source + " is undefined!");
			}

			if (!target) {
				console.log("Target " + link.target + " is undefined!");
			}

			if (source && target)
			{
				this.LINKS.push({
					...link,
					source,
					target,
					distance: VAR_LINK_DISTANCE,
					directed: !!link.directed,
				});
			}
		});

		console.log("Graph has " + this.NODES.length + " nodes and " + this.LINKS.length + " links.")

		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// FORCE SIMULATION OF FORCE-DIRECTED GRAPH
		this.REPULSION_FORCE = d3.forceManyBody().strength(-VAR_REPULSION_STRENGTH);
		this.LINK_FORCE = d3.forceLink(this.LINKS).distance(function(d){ return d.distance; }).strength(VAR_LINK_STRENGTH);

		this.FORCE_SIMULATION = d3.forceSimulation(this.NODES)
			.force("charge", this.REPULSION_FORCE)
			.force("x", d3.forceX(0).strength(VAR_GRAVITY_X))
			.force("y", d3.forceY(0).strength(VAR_GRAVITY_Y))
			.force("link", this.LINK_FORCE)
			.force("collision", d3.forceCollide().radius(function(d){ return 30; }))
			.force("cluster", this.forceCluster())
			.velocityDecay(VAR_FRICTION)
			.alpha(VAR_ALPHA)
			.on("tick", function tick() { renderer.tick(); });

		console.log("Force Graph created")

		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		///  CREATE SVG ELEMENTS

		this.SVG_LINKS = this.GRAPH_LAYER.selectAll(".link")
			.data(this.LINKS).enter()
			.append("line")
			.attr("stroke", VAR_LINK_COLOR)
			.attr("stroke-width", VAR_LINK_WIDTH + "px")
			.attr("opacity", VAR_SHOW_LINKS ? VAR_LINK_OPACITY : 0)
			.attr("marker-end",	function(link) { return link.directed ? "url(#arrow)" : "none"; })
		;

		this.SVG_NODE_CIRCLES = this.GRAPH_LAYER.selectAll(".nodes")
			.data(this.NODES).enter()
			.append("circle")
			.style("stroke", "#222")
			.attr("stroke-width", (VAR_NODE_RADIUS / 4) + "px")
			.attr("r", function(node) { return node.r; })
		;

		this.updateColorMap();

		if (VAR_SHOW_NAMES) {
			this.showNames();
		}

		console.log("SVG Elements Created.")

		this.SVG_DRAGABLE_ELEMENTS = this.SVG_NODE_CIRCLES;

		initInteractions();
		console.log("Interactions available.")
	}

	forceCluster() {
		const strength = 0.2;
		let nodes;
		let oldVarLinkStrength = 0;
		let fn = null;
		let maxClusters = VAR_MAX_CLUSTERS;
		let clusterBy = null;
		let scale = null;
		let clusters = null;
		let clustersUpdated = false; // flag to update clusters on next tick

		function force(alpha) {

			if (VAR_FORCE_CLUSTERS) {

				if (maxClusters !== VAR_MAX_CLUSTERS || clusterBy !== VAR_CLUSTER_BY) {
					fn = null;
					clustersUpdated = true; 
				}

				if (VAR_LINK_STRENGTH > 0) {
					oldVarLinkStrength = VAR_LINK_STRENGTH;
					VAR_LINK_STRENGTH = 0; // disable link strength to avoid cluster movement
					renderer.LINK_FORCE.strength(VAR_LINK_STRENGTH);
				}

				if (fn === null) {
					maxClusters = VAR_MAX_CLUSTERS;

					if (maxClusters > 0) {
						scale = d3.scaleQuantize().domain([0,1]).range(d3.range(maxClusters));
						fn = (d) => scale(getNodeMetric(d, VAR_CLUSTER_BY));
					} else {
						switch (VAR_CLUSTER_BY) {
							case "message":
								fn = (d) => Math.floor(d.avgMessageLengthNormalized * 100);
								break;
							case "links":
								fn = d => d.links.length;
								break;
							case "toxicity":
							default:fn = (d) => Math.floor(d.user_toxicity * 100);
								break;
						}
					}

					clusterBy = VAR_CLUSTER_BY; // save current clusterBy
					clusters = d3.group(nodes, fn);
				}

				const centroids = d3.rollup(nodes, centroid, fn);
				const l = alpha * strength;
				for (const d of nodes)
				{
					const {x: cx, y: cy} = centroids.get(fn(d));
					d.vx -= (d.x - cx) * l;
					d.vy -= (d.y - cy) * l;
				}
			} else {
				if (oldVarLinkStrength > 0 && VAR_LINK_STRENGTH === 0) {
					VAR_LINK_STRENGTH = oldVarLinkStrength;
					renderer.LINK_FORCE.strength(VAR_LINK_STRENGTH);
					oldVarLinkStrength = 0;
				}
				clusters = null;
			}
		}

		force.initialize = _ => nodes = _; 
		force.cluster = () => clusters; 
		force.isDirty = () => clustersUpdated;
		force.setDirty = (v) => clustersUpdated = v;

		return force;
	  }

	initSVGLayers()
	{
		this.CANVAS = d3.select("#reddit_graph").append("g"); // create canvas
		this.GRAPH_LAYER = this.CANVAS.append("g").attr("id", "graphlayer"); // create graph layer
	}


	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	tick()
	{
		// only update visualization each N iterations for performance
		if ((this.tickCounter++) % 2)
			return;

		// move node circles to defined position (d.x,d.y)
		this.SVG_NODE_CIRCLES.attr("cx", function(d) { return d.x; }).attr("cy", function(d) { return d.y; })

		// set links ///////////////////////////////////////////////////TO DO
		this.SVG_LINKS
			.attr("x1", d => d.source.x)
			.attr("y1", d => d.source.y)
			.attr("x2", d => d.target.x)
			.attr("y2", d => d.target.y);

		// set labels
		if (VAR_SHOW_NAMES)
			this.SVG_NODE_LABELS.attr("transform", this.placeLabel)

		if (this.FORCE_SIMULATION.force("cluster").isDirty()) {
			updateClusterInformation();
			this.FORCE_SIMULATION.force("cluster").setDirty(false);
		}
	}


	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	showNames()
	{
		this.SVG_NODE_LABELS = this.GRAPH_LAYER.selectAll(".labels")
			.data(this.NODES).enter()
			.append("text")
			.text(function(node) { return node.name; })
			.style("fill", VAR_LABEL_COLOR)
			.style("stroke", "white")
			.style("stroke-width", VAR_FONT_SIZE / 5)
			.style("paint-order", "stroke")
			.style("font-family", "Calibri")
			.style("font-size", VAR_FONT_SIZE)
			.style("pointer-events", "none")  // to prevent mouseover/drag capture
			.style("opacity", VAR_USER_LABEL_OPACITY)

		// compute label lengths and store them
		this.SVG_NODE_LABELS.each(function(node) { node.labelwidth = this.getComputedTextLength(); })

		// now adjust label position based on label lengths
		this.SVG_NODE_LABELS.attr("transform", this.placeLabel)
	}

	hideNames()
	{
		if (this.SVG_NODE_LABELS)  this.SVG_NODE_LABELS.remove();
	}

	placeLabel(node)
	{
		if (VAR_USER_LABELS_BELOW_NODE)
		{
			// below the node
			var x = node.x - node.labelwidth * 0.5;
			var y = node.y + node.r + 1.0 * VAR_FONT_SIZE;
			return "translate(" + x + ", " + y + ")";
		}
		else
		{
			// right beside the node
			var x = node.x + 1.5 * node.r;
			var y = node.y + VAR_FONT_SIZE/4;
			return "translate(" + x + ", " + y + ")";
		}
	}

	updateLinkDisplay()
	{
		if (this.SVG_LINKS) {
			if (VAR_SHOW_LINKS && VAR_EDGE_FILTER !== "nofilter") {
				this.SVG_LINKS.attr("opacity", (l) => {
					const scale = getEdgeMetric(l, VAR_EDGE_FILTER);
					if (scale >= VAR_EDGE_FILTER_RANGE[0] && scale <= VAR_EDGE_FILTER_RANGE[1]) {
						return VAR_LINK_OPACITY;
					}
					return 0;
				});
			} else {
				this.SVG_LINKS.attr("opacity", (l) => {
					return VAR_SHOW_LINKS ? VAR_LINK_OPACITY : 0;
				});
			}
		}
	}


	updateColorMap()
	{
		if (this.SVG_NODE_CIRCLES && VAR_SET_COLORMAP_NODES) {
			this.SVG_NODE_CIRCLES.style("fill", function(node) {
				const value = getNodeMetric(node, VAR_NODE_COLOR_BY);
				return VAR_INTERPOLATOR_NODES(value).toString()
			});
		} else {
			this.SVG_NODE_CIRCLES.style("fill", VAR_NODE_COLOR);
		}

		if (this.SVG_LINKS && VAR_SET_COLORMAP_NODES) {
			this.SVG_LINKS.style("stroke", function(link) {
				let value = getEdgeMetric(link, VAR_EDGE_COLOR_BY);
				return VAR_INTERPOLATOR_EDGES(value).toString()
			});
		} else {
			this.SVG_LINKS.style("stroke", VAR_LINK_COLOR)
		}
	}

	restartSimulation()
	{
		renderer.FORCE_SIMULATION.alpha(VAR_ALPHA).restart();
	}

	stopSimulation()
	{
		renderer.FORCE_SIMULATION.alpha(0);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//PUT NODE AND LINK INFO HERE
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	getNodeAttributesAsString(node)
	{
		return `${node.name} ${node.id ? '(' + node.id + ')' : ''}`
			+ `\nToxicity: ${node.user_toxicity.toFixed(4)}\n`
			+ `Links: ${node.links?.length ?? 0}\n`
			+ `Avg Message Length: ${Math.floor(node.avgMessageLength)} (${node.avgMessageLengthNormalized.toFixed(4)})`;
	}

	getLinkAttributesAsString(link)
	{
		return "Id: " + link.link_id
			+ "\nMessage: " + link.text
			+ "\nToxicity: " + link.link_toxicity
			+ "\nMessage length: " + link.text.length;
	}
}


function getNodeValue(node, field)
{
	switch (field) {
		case "message":
			return node.avgMessageLength;
		case "links":
			return node.links?.length ?? 0;
		case "toxicity":
			return node.user_toxicity;
		// normalize toxicity score to [0,1]. Maximum of the data is 1 and minimum is -1
		default:
			return 0;
	}
}

function getNodeMetric(node, field)
{
	switch (field) {
		case "message":
			return node.avgMessageLengthNormalized;
		case "links":
			return node.linkLengthNormalized;
		case "toxicity":
			return (node.user_toxicity - (-1)) / (1 - (-1));
			// normalize toxicity score to [0,1]. Maximum of the data is 1 and minimum is -1
		default:
			return 1;
	}
}

function getEdgeMetric(link, field)
{
	switch (field) {
		case "toxicity":
			return (link.link_toxicity - (-1)) / (1 - (-1)); // TODO normalize when loading the file
		case "message":
			return link.messageLengthNormalized;
		default:
			return 1;
	}
}

function updateNodeRadius() {
	if (!renderer.SVG_NODE_CIRCLES) {
		return;
	}

	renderer.SVG_NODE_CIRCLES.attr("r", (node) => {
		return VAR_NODE_RADIUS * getNodeMetric(node, VAR_NODE_SIZE_MODIFIER);
	});

	renderer.restartSimulation();
}

function centroid(nodes) {
	let x = 0;
	let y = 0;
	let z = 0;
	for (const d of nodes) {
	  let k = d.r ** 2;
	  x += d.x * k;
	  y += d.y * k;
	  z += k;
	}
	return {x: x / z, y: y / z};
  }
