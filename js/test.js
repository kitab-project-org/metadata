var bookRelationsUrl = "https://raw.githubusercontent.com/OpenITI/kitab-metadata-automation/master/output/OpenITI_Github_clone_book_relations.json?v1";

var bookRelations = (function(){
  var relData = null;
  $.ajax({
    'async': false,
    'global': false,
    //'url': "db/bookRelations.json",
    'url': bookRelationsUrl,
    'dataType': "json",
    'success': function (data) {
      relData = data;
    }
  });
  return relData;
})();

var createGraph = function(graph_div, bookuri, bookRelations){

  // define the hierarchical level of each book on the graph based on its date:
  var nodeLevels = [];
  for (const relObj of bookRelations[bookuri]){
    for (const sd of ["source", "dest"]) {
      try {
        var date = parseInt(relObj[sd].substr(0,4));
        console.log(date);
        if (!nodeLevels.includes(date)) {
          nodeLevels.push(date);
        }
      }
      catch(e) {
        var date = parseInt(bookuri.substr(0,4));
      }
    }
  }
  nodeLevels.sort();

  // initialize nodes and edges datasets:
  var mainDate = parseInt(bookuri.substr(0,4));
  level = nodeLevels.indexOf(mainDate);
  var nodes = new vis.DataSet([{
    id: bookuri,
    label: bookuri,
    level: level,
    color: "red"  // give the main book node a different color
  }]);
  var edges = new vis.DataSet([]);

  // add the data to the nodes and edges datasets:
  for (const relObj of bookRelations[bookuri]){
    // add nodes:
    for (const sd of ["source", "dest"]) {
      try {
        var date = parseInt(relObj[sd].substr(0,4));
        //console.log(date);
        level = nodeLevels.indexOf(date);
        //console.log(level);
      }
      catch(e) { // no date found in book id: put book on same level as main book
        var date = parseInt(bookuri.substr(0,4));
        level = nodeLevels.indexOf(date);
        //console.log(level);
      }
      try {
        nodes.add({
          id: relObj[sd],
          label: relObj[sd],
          level: level
        });
        //nodes.add({id: relObj[sd], label: relObj[sd]});
      }
      catch(e) {
        console.log(relObj[sd] + " already in nodes list");
      }
      // add edges:
      try {
        edges.add({
          from: relObj["source"],
          to: relObj["dest"],
          label: relObj["main_rel_type"],
          font: {align: "middle"}
        })
      }
      catch(e) {
        //console.log(relObj["source"] + " -> " + relObj["dest"] + " already in edges list");
      }
    }


  }

  // provide the data in the vis format
  var data = {
    nodes: nodes,
    edges: edges
  };
  var options = {
    nodes: {
      shape: "box"
    },
    edges: {
      smooth: {
        type: "curvedCW",
        //type: 'cubicBezier',
        //forceDirection: 'vertical',
        //roundness: 1
      },
      color: 'lightgray'
    },
    layout: {
      hierarchical: {
        direction: 'UD',
        nodeSpacing: 150,
        //levelSeparation: 150,
        //shakeTowards: "roots"
        //sortMethod: "directed"
      }
    },
    interaction: {dragNodes: true},
    physics: true
  };

  // initialize your network!
  var network = new vis.Network(graph_div, data, options);
}

$(document).ready(function () {
  var graph_div = document.getElementById('graph');
  console.log(graph_div);
  //graph_div.html("<p>TEST</p>");
  var bookuri = "0275AbuDawudSijistani.Sunan";
  //var bookuri = "0833IbnJazari.MatnTayyibaNashr";
  createGraph(graph_div, bookuri, bookRelations);
  console.log("finished");

  var graph2_div = document.getElementById('graph2');
  var network = new vis.Network(
    graph2_div,
    data = {
      nodes: [
        {
          id: "a",
          label: "a",
          level: 0,
          color: "red"
        },
        {
          id: "b",
          label: "b",
          level: 1,
        },
        {
          id: "c",
          label: "c",
          level: 1,
        },
      ],
      edges: [
        {
          from: "a",
          to: "b",
          label: "COMM",
          font: {align: "middle"},
          arrows: "to",
          roundness: 0.4
        },
        {
          from: "a",
          to: "c",
          label: "COMM",
          font: {align: "middle"},
          arrows: "to",
          smooth: {
            roundness: 0.8
          },
        },
        {
          from: "a",
          to: "c",
          label: "ABR",
          font: {align: "middle"},
          arrows: "to",
          smooth: {
            roundness: 0.3
          },
        },
      ]
    },
    options = {
      nodes: {
        shape: "box"
      },
      edges: {
        smooth: {
          type: "curvedCW",
          //type: 'cubicBezier',
          //forceDirection: 'vertical',
          //roundness: 1
        }
      },
      layout: {
        hierarchical: {
          direction: 'UD',
          nodeSpacing: 300,
          //levelSeparation: 150,
          //shakeTowards: "roots"
          //sortMethod: "directed"
        }
      },
      interaction: {
        dragNodes: true,
        hover: true
      },
      physics: true,
      width: "100%",
      height: "100%"
    }
  )
});
