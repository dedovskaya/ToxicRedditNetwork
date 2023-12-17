let NodePositions = null;
var renderer;

function resetSVGLayers()
{
    d3.select("#graphlayer").remove();
}

// Process JSON and create graph.
function processJSON(json, filename)
{
    //---------------- message length normalization for edges
    let minMsgLength = 9999999999;
    let maxMsgLength = 0;
    let minLinkLength = 9999999999;
    let maxLinkLength = 0;

    json.nodes.forEach((node) => {
        node.avgMessageLength = getAvgMessageLength(node);
        minMsgLength = Math.min(node.avgMessageLength, minMsgLength);
        maxMsgLength = Math.max(node.avgMessageLength, maxMsgLength);

        minLinkLength = Math.min(node.links?.length ?? 0, minLinkLength);
        maxLinkLength = Math.max(node.links?.length ?? 0, maxLinkLength);
    });

    let minMsgLog = Math.log(minMsgLength === 0 ? 0.1 : minMsgLength);
    let msgDivisor = Math.log(maxMsgLength) - minMsgLog;

    let minLinkLog = Math.log(minLinkLength === 0 ? 0.1 : minLinkLength);
    let linkDivisor = Math.log(maxLinkLength) - minLinkLog;

    json.nodes.forEach((node) => {
        node.avgMessageLengthNormalized = node.avgMessageLength === 0 ? 0 : (Math.log(node.avgMessageLength) - minMsgLog) / msgDivisor;
        node.linkLengthNormalized = (node.links?.length ?? 0) === 0 ? 0 : (Math.log(node.links.length) - minMsgLog) / linkDivisor;
    });

    //---------------- message length normalization for links
    minMsgLength = 9999999999;
    maxMsgLength = 0;

    json.links.forEach((link) => {
        minMsgLength = Math.min(minMsgLength, link.text.length);
        maxMsgLength = Math.max(maxMsgLength, link.text.length);
    });

    minMsgLog = Math.log(minMsgLength === 0 ? 0.1 : minMsgLength);
    msgDivisor = Math.log(maxMsgLength) - minMsgLog;

    json.links.forEach((link) => {
        link.messageLengthNormalized = (Math.log(link.text.length) - minMsgLog) / msgDivisor;
    });

    setDefaultParameters();
    renderer.createForceGraphJSON(json);
}

function getAvgMessageLength(node)
{
    const length = node.links.reduce((l, link) => {
        return l + (link?.text?.length ?? 0);
    }, 0);

    return node.links.length > 0 ? length / node.links.length : 0;
}

function onChangeFile(event)
{
    var fileinput = document.getElementById("browse");
    var textinput = document.getElementById("filename");
    textinput.value = fileinput.files[0].name;

    var file = event.target.files[0];
    if (!file) {
        return;
    }
    var reader = new FileReader();

    reader.onload = function (e)
    {
        // stop current simulations and reset SVG layers

        if (renderer?.FORCE_SIMULATION) {
            renderer.FORCE_SIMULATION.stop();
        }

        resetSVGLayers(); 
        loadGraphFromUrl(e.target.result, file.name);
    };
    reader.readAsDataURL(file);
}

// load data and create force graph
function loadGraphFromUrl(url, filename)
{
    VAR_FILENAME = filename;
    VAR_SOURCE_FILE = filename;

    if (filename.endsWith(".json"))
    {
        renderer = new GraphRenderer();
        d3.json(url).then(function(json) { processJSON(json, filename); });
    }
    else
        console.error("File type Error: Unknown");
}



