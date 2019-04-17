// must be var to be accessible for the test
// eslint-disable-next-line
var nodesPublic = [];
// eslint-disable-next-line
var edgesPublic = [];

// https://medium.freecodecamp.org/environment-settings-in-javascript-apps-c5f9744282b6
let baseUrl;

// The try and catch are usefull for the tests
try {
  baseUrl = (window.location.hostname === 'localhost' || (window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:3000'
    : 'https://tweb-project1.herokuapp.com';
} catch (err) {
  console.log('Window not loaded');
}

let nodes = [];
let edges = [];
let network = null;

// Get the nodes
function getNodes() {
  return nodesPublic;
}

// Get the edges
function getedges() {
  return edgesPublic;
}

// Show a laoding gif
function loading() {
  $('#mynetwork').empty();
  $('#mynetwork').append('<img id ="loading" src="gif/loading.gif" alt="Loading">');
}

/**
  * @desc Get string to add to value when user hovers the node
  * @param field - the field choose by the user
  * @param value - the value enter by the user
*/
function getHoverString(field, value) {
  let hoverString = '';
  switch (field) {
    case 'Language':
      let result = value/1000000
      hoverString = `${result}  MB written`;
      break;
    case 'Location':
      hoverString = `From  ${value}`;
      break;
    default:
      hoverString = value;
  }
  return hoverString;
}


// Called when the Visualization API is loaded.
function draw() {
  // create a network
  const container = document.getElementById('mynetwork');

  const data = {
    nodes,
    edges,
  };

  const options = {
    nodes: {
      borderWidth: 4,
      size: 30,
      color: {
        border: '#222222',
        background: '#666666',
      },
      font: { color: 'black' },
      title: 'cannot help',
    },
    edges: {
      color: 'lightgray',
    },
  };

  // eslint-disable-next-line
  network = new vis.Network(container, data, options);

  network.on('doubleClick', (params) => {
    const tmp = params;
    const currentNodes = nodes.find(x => x.id === tmp.nodes[0]);

    // open the github url of the selected node
    if (currentNodes.html_url) {
      window.open(currentNodes.html_url);
    }
  });
}

// Fetch the content of a user
function getUser(username) {
  return fetch(`${baseUrl}/users/${username}`)
    .then(res => res.json());
}

// Fetch the repos of a user
function getRepos(username) {
  return fetch(`${baseUrl}/repos/${username}`)
    .then(res => res.json());
}
/**
  * @desc create the graph
  * @param data - the data send by the server
  * @param field - the field choose by the user
  * @return bool - true or false
*/
function createGraph(data, field) {
  const arrayIds = [];
  nodes = [];
  edges = [];
  const edgesMemory = [];

  try {
    let first = true;
    const nodeHelpColor = {};
    nodeHelpColor.border = '#FFD700';
    data.forEach((item) => {
      // eslint-disable-next-line
      const root = item.root;
      // The root
      if (first) {
        const rootClean = {};
        rootClean.id = root.id;
        // Add to the list
        arrayIds.push(rootClean.id);
        // Create the node
        rootClean.shape = 'circularImage';
        rootClean.image = root.avatar_url;
        rootClean.label = root.login;
        rootClean.html_url = root.html_url;
        rootClean.color = '#A0FFA0';
        rootClean.title = 'you';

        nodes.push(rootClean);
        first = false;
      }

      // Contributors
      // eslint-disable-next-line
      const contributors = item.contributors;
      contributors.forEach((contributor) => {
        const current = {};
        current.id = contributor.id;
        // if not already created
        if (!arrayIds.includes(current.id)) {
          // Add to the list
          arrayIds.push(current.id);
          // create the node
          current.shape = 'circularImage';
          current.image = contributor.avatar_url;
          current.label = contributor.login;
          current.html_url = contributor.html_url;

          if (Object.prototype.hasOwnProperty.call(contributor, 'predicate') && contributor.predicate[0] === true) {
            // node is a helper
            current.color = nodeHelpColor;
            console.log(contributor.predicate[0]);
            console.log(contributor.predicate[1]);
            current.title = getHoverString(field, contributor.predicate[1]);
          }
          nodes.push(current);
        }

        // Create the edge
        const edge = {};
        const edgeColor = {};
        edgeColor.inherit = false;
        edge.color = edgeColor;
        edge.from = root.id;
        edge.to = contributor.id;

        if (edge.from !== edge.to) {
          const edgeInvert = `${edge.to}-${edge.from}`;
          if (!edgesMemory.includes(edgeInvert)) {
            // Save the pair
            edgesMemory.push(`${edge.from}-${edge.to}`);
            edges.push(edge);
          }
        }
        nodesPublic = nodes;
        edgesPublic = edges;
      });
    });
    return true;
  } catch (err) {
    return false;
  }
}

/**
  * @desc Get the contributors
  * @param data - the data send by the server
  * @param field - the field choose by the user
  * @param value - the value enter by the user
*/
function getContributors(username, field, value) {
  return fetch(`${baseUrl}/contributors/${username}/${field}/${value}`)
    .then((res) => {
      if (res.ok) {
        return res.json();
      }
      throw new Error(res.status);
    });
}

/**
  * @desc Show a error message
  * @param message -the error message
*/
function showErrorMessage(message) {
  console.log(`Error message :  ${message}`);

  let errorMessage;
  switch (message) {
    case 'NetworkError when attempting to fetch resource.':
      errorMessage = 'Server is down :(';
      break;
    case 'graph-error':
      errorMessage = 'Error while generating graph :('
      break;
    case '403':
      errorMessage = 'Too many requests, try again in 60 min...';
      break;
    case '404':
      // eslint-disable-next-line
      const user = $('#username').val();
      errorMessage = `Github user or data not found : ${user}`;
      break;
    case '500':
      errorMessage = 'Server error...';
      break;
    default:
      errorMessage = 'Something went wrong sorry...';
  }
  $('#mynetwork').empty(); // remove loading image
  const x = document.getElementById('snackbar');
  x.textContent = errorMessage;
  x.className = 'show';
  // eslint-disable-next-line
  setTimeout(function(){ x.className = x.className.replace('show', ''); }, 3000);
}

/**
  * @desc Initiate the graph
  * @param data - the data send by the server
  * @param field - the field choose by the user
  * @param value - the value enter by the user
*/
function initiateGraph(username, field, value) {
  getContributors(username, field, value).then((data) => {
    if (createGraph(data, field, value)) {
      $('#loading').addClass('hidden');
      draw();
    } else {
      showErrorMessage('graph-error');
    }
  }).catch((err) => {
    console.error(err.message);
    showErrorMessage(err.message);
  });
}

// The try and catch are usefull for the tests
try {
  $(() => {
  // When the user click the button
    $('#searchButton').click(() => {
      const username = $('#username').val();
      const field = $('#search-field').val();
      const value = $('#search-value').val();
      if (username.length > 0) {
        if (value.length > 0) {
          loading();
          initiateGraph(username, field, value);
        }
      }
    });
  });
} catch (err) {
  console.log('Jquery not loaded');
}
try {
  module.exports = {
    getNodes,
    getedges,
    createGraph,
    getRepos,
    getUser,

  };
} catch (err) {
  console.log('Module not loaded');
}
