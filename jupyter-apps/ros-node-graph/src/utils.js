import _ from 'lodash';
import DagreD3 from 'dagre-d3';
import * as d3 from 'd3'

export function createAndPopulateGraph(graph, targetElementId) {
  const g = new DagreD3.graphlib.Graph().setGraph({
    rankdir: 'LR',
  });
  const initialScale = 0.75;
  const svg = d3.select(`#${targetElementId}`);
  const inner = svg.select('g');
  // Create the renderer
  /* eslint-disable-next-line */
  const render = new DagreD3.render();

  // Set up zoom support
  const zoom = d3.zoom().on('zoom', function() {
    inner.attr('transform', d3.event.transform);
  });
  svg.call(zoom);
  graph.nodes.forEach(function(node) {
    g.setNode(node.id, { label: node.label, shape: node.type });
  });

  graph.edges.forEach(function(edge) {
    g.setEdge(edge.source.id, edge.target.id, { label: edge.value });
  });

  // Set some general styles
  g.nodes().forEach(function(v) {
    const node = g.node(v);
    node.rx = 5;
    node.ry = 5;
  });
  // Run the renderer. This is what draws the final graph.
  render(inner, g);
  svg.call(
    zoom.transform,
    d3.zoomIdentity
      .translate(
        (svg.attr('width') - g.graph().width * initialScale) / 2 +
          Number(svg.style('width').slice(0, -2)) / 2,
        Number(svg.style('height').slice(0, -2)) / 2 -
          (g.graph().height * initialScale) / 2,
      )
      .scale(initialScale),
  );
  svg.attr('height', g.graph().height * initialScale + 40);

  return {
    svg,
    g,
    initialScale,
    zoom,
  };
}

export function reposition({ svg, zoom, g, initialScale }) {
  svg.call(
    zoom.transform,
    d3.zoomIdentity
      .translate(
        (svg.attr('width') - g.graph().width * initialScale) / 2 +
          Number(svg.style('width').slice(0, -2)) / 2,
        Number(svg.style('height').slice(0, -2)) / 2 -
          (g.graph().height * initialScale) / 2,
      )
      .scale(initialScale),
  );
  // svg.attr('height', g.graph().height * initialScale + 40);
  svg.attr('height', window.innerHeight);
}

export const stopPropagation = e => e.stopPropagation();

export const downloadFile = (content, filename, options = {}) => {
  const element = document.createElement('a');
  element.setAttribute(
    'href',
    `data:${options.mimetype || 'text/json'};charset=utf-8,${encodeURIComponent(
      content,
    )}`,
  );
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};


export function updateOptionsUtil(e) {
  const {
    options: { key },
    updateVizOptions,
  } = this.props;
  const {
    checked,
    dataset: { id: optionId },
    value,
  } = e.target;
  updateVizOptions(key, {
    [optionId]: _.has(e.target, 'checked') ? checked : value,
  });
}

export function promisifyGetNodeDetails(ros, node) {
  return new Promise(function(res, rej) {
    try {
      ros.getNodeDetails(node, function({ publishing, subscribing }) {
        res({ publishing, subscribing, node });
      });
    } catch (err) {
      rej(err);
    }
  });
}

/**
 *
 * @param {Array} topics - a list of topics
 * @param {Object} nodeDetails - List of node details with node name, publishing topics and subsribing topics
 * @returns {auxGraphData} - For creating graph later based on options.
 */
export function createAuxGraph(topics, nodeDetails) {
  const auxGraphData = {};

  topics.forEach(topic => {
    auxGraphData[topic] = { publishers: [], subscribers: [] };
  });
  nodeDetails.forEach(function({ publishing: pubs, subscribing: subs, node }) {
    pubs.forEach(topic => {
      auxGraphData[topic].publishers.push(node);
    });
    subs.forEach(topic => {
      auxGraphData[topic].subscribers.push(node);
    });
  });

  return auxGraphData;
}

export function defaultGraph(graph) {
  const edges = [];
  const { auxGraphData } = graph;
  _.each(_.keys(auxGraphData), t => {
    const { publishers } = auxGraphData[t];
    const { subscribers } = auxGraphData[t];

    _.each(publishers, pub => {
      _.each(subscribers, sub => {
        edges.push({
          source: { id: pub, label: pub },
          target: { id: sub, label: sub },
          value: t,
        });
      });
    });
  });
  return { nodes: graph.nodes, edges };
}

export function graphWithTopicNodes(graph) {
  const newNodes = [...graph.nodes];
  const edges = [];
  const { auxGraphData } = graph;
  // Adding topic as nodes
  _.keys(graph.auxGraphData).forEach(topicName => {
    newNodes.push({
      id: topicName + topicName,
      label: topicName,
      type: 'rect',
    });
  });

  _.each(_.keys(auxGraphData), t => {
    const { publishers } = auxGraphData[t];
    const { subscribers } = auxGraphData[t];

    _.each(publishers, pub => {
      edges.push({
        source: { id: pub, label: pub },
        target: { id: t + t, label: t },
        value: '',
      });
    });

    _.each(subscribers, sub => {
      edges.push({
        source: { id: t + t, label: t },
        target: { id: sub, label: sub },
        value: '',
      });
    });
  });

  return { nodes: newNodes, edges };
}

/**
 *
 * @param {*} ros - Ros reference
 * @returns {Promise} - graph object represents nodes and links as edges.
 */
export function generateGraph(ros) {
  const graph = {};

  return new Promise(function(res, rej) {
    ros.getNodes(nodes => {
      graph.nodes = _.map(nodes, node => ({
        id: node,
        label: node,
        type: 'ellipse',
      }));

      ros.getTopics(function({ topics }) {
        Promise.all(
          nodes.map(function(node) {
            return promisifyGetNodeDetails(ros, node);
          }),
        )
          .then(function(data) {
            graph.auxGraphData = createAuxGraph(topics, data);
            res(graph);
          })
          .catch(function(err) {
            rej(err);
          });
      });
    });
  });
}
