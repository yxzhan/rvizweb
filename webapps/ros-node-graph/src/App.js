import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import ROSLIB from 'roslib';
import { Button, Form } from 'react-bootstrap';
import { generateGraph, defaultGraph, graphWithTopicNodes, createAndPopulateGraph, reposition  } from './utils';

const ros = createRos(getWsUrl())
let nodeOnly = true
refreshGraph(ros)

function App() {
  function handleSelect(e) {
    e.preventDefault();
    nodeOnly = !!Number(e.target.value)
    refreshGraph(ros)
  }
  function handleClick(e) {
    e.preventDefault();
    refreshGraph(ros)
  }

  return (
    <div className="App">
      <div className="Toolbar">
      <Form.Select aria-label="Default select example" onChange={handleSelect}>
        <option value="1">Nodes only</option>
        <option value="0">Nodes/Topic (all)</option>
      </Form.Select>
        <Button variant="primary" onClick={handleClick}>Refresh</Button>
      </div>
      <header className="App-header">
      <svg id="graph">
        <g />
      </svg>
      </header>
    </div>
  );
}

function getWsUrl () {
  let baseUrl = new URLSearchParams(document.location.search).get("baseurl")
  if (!baseUrl) {
    return 'ws://localhost:9090'
  }
  let wsUrl = new URL(baseUrl);
  wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws'
  return wsUrl.href + 'proxy/9090'
}

function refreshGraph(ros) {
  const p = generateGraph(ros);
  p.then(graph => {
    graph.nodes = graph.nodes.filter(v => v.id !== '/rosout')
    delete graph.auxGraphData['/rosout']
    delete graph.auxGraphData['/rosout_agg']
    let newGraph = null;
    if (nodeOnly) {
      newGraph = defaultGraph(graph);
    } else {
      newGraph = graphWithTopicNodes(graph);
    }
    let svg = createAndPopulateGraph(newGraph, 'graph')
    window.addEventListener('resize', () => {
      reposition(svg)
    })
    reposition(svg)
    reposition(svg)
  })
  
}

function createRos(url) {
  let ros = new ROSLIB.Ros({url})
  ros.on('error', error => { 
    console.log( error )
  })
  ros.on('connection', evt => {
    console.log('Connection made!');
  })
  return ros
}

export default App;
