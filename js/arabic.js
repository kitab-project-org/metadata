var table;
const url = "https://raw.githubusercontent.com/OpenITI/kitab-metadata-automation/master/output/OpenITI_Github_clone_metadata_light.json?v1";
const bookRelationsUrl = "https://raw.githubusercontent.com/OpenITI/kitab-metadata-automation/master/output/OpenITI_Github_clone_book_relations.json?v1";
var issueURItempl = "<a href ='https://github.com/OpenITI/Annotation/issues/new?";
issueURItempl += "assignees=&labels=URI+change+suggestion&template=change-uri.md&title=";
//url ="db/OpenITI_metadata_light-isnad-arabic-28052020.json"



/////////////// BOOK RELATIONS POPUP ////////////////////////////////////////////

// check whether two objects have the same values for the given keys:
const objEquals = function(obj1, obj2, keys){
  for (const k of keys){
    if (obj1[k] !== obj2[k]){
      return false;
    }
  }
  return true;
};

// check whether a given array `arr` contains an object `obj` that has the same values for the given keys:
const objInArray = function(obj, arr, keys){
  for (const el of arr){
    if (objEquals(obj, el, keys)){
      return true;
    }
  }
  return false;
}

// expand book relations: add related books for each related book (recursive):
const expandBookRelations = function(d, n){
  console.log(n+" recursions to go");
  if (n === 0){
    return d;
  }
  n = n-1;
  let added_book_rels = 0;
  let bookuris = Object.keys(d);
  let newD = {};
  for (const bookuri of bookuris){
    //console.log(bookuri)
    newD[bookuri] = d[bookuri];
    let all_rel_books = [];
    for (const rel of d[bookuri]){
      for (const ds of ["source", "dest"]){
      //for (const ds of ["dest"]){
        if (! all_rel_books.includes(rel[ds])){
          all_rel_books.push(rel[ds]);
        }
      }
    }
    //console.log("related books: " + all_rel_books.length);
    //console.log(all_rel_books);
    for (const book of all_rel_books){
      //console.log("book: " + book);
      for (const rel of d[book]){
        //console.log("rel: " + rel["source"] + " > " + rel["dest"]);
        if (! objInArray(rel, newD[bookuri], ["source", "dest", "main_rel_type"])){
          newD[bookuri].push(rel);
          added_book_rels += 1;
        }
        //console.log(newD[bookuri]);
      }
    }
  }
  //console.log("Enter new recursion!");
  if (added_book_rels > 0){
    return expandBookRelations(newD, n);
  } else{
    console.log("no more book relations found; exiting.");
    return newD;
  }
};


// load book relations metadata:
const bookRelations = (function(){
  let relData = null;
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
  //console.log("relData.length: "+ Object.keys(relData).length);
  relData = expandBookRelations(relData, 10);
  return relData;
})();


// define whether edge objects have the same `from`, `to` and `label` values
const edgeEquals = function(edge, edge2){
  /*for (const el of ["from", "to", "label"]){
    console.log(el);
    if (edge[el] !== edge2[el]){
      return false;
    }
  }
  return true;*/
  return objEquals(edge, edge2,  ["from", "to", "label"]);
};

// verbose explanation of the main book relation types, seen from the yml text:
const bookRelVerbsSrc = {
  "COMM": " is a commentary on ",
  "ABR": " is an abridgment of ",
  "COMP": " is a compilation of ",
  "CONT": " is a continuation of ",
  "TRANSL": " is a translation of ",
  "TRANSM": " transmits ",
  "REARR": " is a rearrangement of ",
  "EXTRACT": " is an extract of ",
  "CORRESPONDENT": " is an exchange with ",
  "PART": " is a part of ",
  "REWORK": " is a reworking of ",
};

// verbose explanation of the main book relation types, seen from the other text:
const bookRelVerbsDest = {
  "COMM": " was commented on by ",
  "ABR": " was abridged by ",
  "COMP": " was compiled by ",
  "CONT": " was continued by ",
  "TRANSL": " was translated in ",
  "TRANSM": " was transmitted in ",
  "REARR": " was rearranged in ",
  "EXTRACT": " has an extract in ",
  "CORRESPONDENT": " participates in an exchange with ",
  "PART": " has a part in ",
  "REWORK": " was reworked in "
};

// define the colors to be used for the edges, dependent on the main relation type:
const edge_colors = {
  "COMM": "blue",
  "ABR": "lightgray",
  "COMP": "red",
  "CONT": "orange",
  "TRANSL": "green",
  "TRANSM": "black",
  "REARR": "pink",
  "EXTRACT": "lightgreen",
  "CORRESPONDENT": "darkred",
  "PART": "darkorange",
  "REWORK": "grey",
};

// define the roundness of the edge's curve, dependent on the main relation type:
// (in order to avoid overlapping edges)
const edge_roundness = {
  "COMM": 0.1,
  "ABR": 1,
  "COMP": 0.3,
  "CONT": 0.7,
  "TRANSL": 0.5,
  "TRANSM": 0.9,
  "REARR": 0.8,
  "EXTRACT": 0.75,
  "CORRESPONDENT": 0.2,
  "PART": 0.4,
  "REWORK": "0.6"
};

// create book relations graph:
const createGraph = function(graph_div, bookuri, bookRelations){
  console.log("creating graph");

  // define the hierarchical level of each book on the graph based on its date:
  let nodeLevels = [];
  for (const relObj of bookRelations[bookuri]){
    for (const sd of ["source", "dest"]) {
      let date;
      try {
        date = parseInt(relObj[sd].substr(0,4));
        //console.log(date);
        //if (!nodeLevels.includes(date)) {
        //  nodeLevels.push(date);
        //}
      }
      catch(e) {
        date = parseInt(bookuri.substr(0,4));
      }
      console.log(date);
      if (!nodeLevels.includes(date)) {
        nodeLevels.push(date);
      }
    }
  }
  nodeLevels.sort();

  // initialize nodes and edges datasets:
  let mainDate = parseInt(bookuri.substr(0,4));
  let level = nodeLevels.indexOf(mainDate);
  let nodes = new vis.DataSet([{
    id: bookuri,
    label: bookuri,
    level: level,
    color: "red"  // give the main book node a different color
  }]);
  //var edges = new vis.DataSet([]);
  let edges = [];

  // add the data to the nodes and edges datasets:
  for (const relObj of bookRelations[bookuri]){
    // add nodes:
    for (const sd of ["source", "dest"]) {
      try {
        let date = parseInt(relObj[sd].substr(0,4));
        //console.log(date);
        level = nodeLevels.indexOf(date);
        //console.log(level);
      }
      catch(e) { // no date found in book id: put book on same level as main book
        let date = parseInt(bookuri.substr(0,4));
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
      let edge = {
        from: relObj["source"],
        to: relObj["dest"],
        label: relObj["main_rel_type"],  // will be displayed on the edge
        font: {align: "middle"},         // location of the displayed label: on the edge
        arrows: "to",                    // location of the arrowhead
        color: edge_colors[relObj["main_rel_type"]],
        title: relObj["source"] + (bookRelVerbsSrc[relObj["main_rel_type"]] || " " + relObj["main_rel_type"] + " ") + relObj["dest"],  // popup message on hover
        smooth: {
          roundness: edge_roundness[relObj["main_rel_type"]] || 0.0  // make sure edges of different types do not overlap
        }
      };
      //if (! edges.includes(edge)){
      //if (! edgeInEdges(edge, edges)){
      if (! objInArray(edge, edges, ["from", "to", "label"])){
        edges.push(edge);
      }
    }
  }
  console.log(edges);
  // provide the data in the vis format
  let data = {
    nodes: nodes,
    edges: edges
  };
  let options = {
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
    layout: {  // see https://visjs.github.io/vis-network/docs/network/layout.html
      hierarchical: {
        direction: 'UD',           // "UD" = up - down
        nodeSpacing: 300,          // space between nodes on the same level
        edgeMinimization: false,  // if set to false, network will be spaced out more
        blockShifting: false,
        parentCentralization: false
        //levelSeparation: 150,
        //shakeTowards: "roots"
        //sortMethod: "directed"
      }
    },
    interaction: {
      dragNodes: true,
      hover: true
    },
    //physics: false,  // physics are used to balance the network
    /*physics: {
      barnesHut: {
        avoidOverlap: 1
      }
    },*/
    //physics: true,
    physics: {  // see https://stackoverflow.com/a/32522961
      forceAtlas2Based: {
          gravitationalConstant: -26,
          centralGravity: 0.005,
          springLength: 230,
          springConstant: 0.18,
          avoidOverlap: 10
      },
      maxVelocity: 146,
      solver: 'forceAtlas2Based',
      timestep: 0.35,
      stabilization: {
          enabled: true,
          iterations: 1000,
          updateInterval: 25
      }
    },
    width: "100%",
    height: "100%",
  };

  // initialize the network:
  let network = new vis.Network(graph_div, data, options);

  // use physics only to get the initial network balanced out; do not use after user moved nodes:
  network.on("stabilizationIterationsDone", function () {
    network.setOptions( { physics: false } );
  });

  // make it possible to save the network:
  network.on("afterDrawing", function (ctx) {
    let dataURL = ctx.canvas.toDataURL();
    document.getElementById('downloadGraph').href = dataURL;
    document.getElementById('downloadGraph').download = bookuri + "_relations.png";
  });
  // NB: for later: svg export: https://github.com/justinharrell/vis-svg/blob/master/svg-export.html
}

// Add book relations info to the modal popup:
//let fillModal = function(bookuri, graph_div){
let fillModal = function(bookuri){
  console.log("filling modal");
  console.log(bookuri);
  let bookRelationsModal = $("#bookRelModal");
  bookRelationsModal.find('.modal-title').text('Books related to ' + bookuri);
  let relStr = "<ul>";
  console.log(bookuri);
  console.log(bookRelations[bookuri]);
  for (let i = 0; i < bookRelations[bookuri].length; i++) {
    let relObj = bookRelations[bookuri][i];
    if (bookuri === relObj["source"]) {
      relStr += "<li>" + (bookRelVerbsSrc[relObj["main_rel_type"]] || " " + relObj["main_rel_type"] + " ") + relObj["dest"] + "</li>";
    } else {
      relStr += "<li>" + (bookRelVerbsDest[relObj["main_rel_type"]] || " " + relObj["main_rel_type"] + " ") + relObj["source"] + "</li>";
    }
  }
  relStr += "</ul>";

  //bookRelationsModal.find('.modal-body').html(relStr);
  let graph_div = document.getElementById("graph");
  console.log(graph_div);
  createGraph(graph_div, bookuri, bookRelations);
  $("#bookRelModal").modal("toggle");
};


///////////////////////// BUILD TABLE //////////////////////////////////////////

// Add Arabic font for pdfMake:
pdfMake.fonts = {
    Amiri: {
        normal: 'Amiri-Regular.ttf',
        bold: 'Amiri-Bold.ttf',
        italics: 'Amiri-Slanted.ttf',
        bolditalics: 'Amiri-BoldSlanted.ttf'
    }
}
//console.log("test");
//console.log(pdfMake.fonts);

$(document).ready(function () {

    function pad(n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }


    var srtContainer;
    var count;

    function checknull(data) {

        if (data != null) {
            return data;
        }
        else {
            return '';
        }

    }


    table = $('#example').DataTable({
        "order": [[3, "asc"]],
        //"sDom": '<"wrapper"lfptip>',
        "sDom": "<'row rowpadding'B><'row'><'row'<'col-md-6'ilp><'col-md-6'f>r>t<'row'<'col-md-4'i>><'row'<'#colvis'>p>",
        "autoWidth": false,

        "createdRow": function (row, data, dataIndex) {
            /*if (data['url'].includes('completed') || data['url'].includes('inProgress') || data['url'].includes('mARkdown')) {
                $(row).addClass('completed');
            }*/

            if (data['status'].includes('pri')) {
                $('tr').addClass('.primary_book')
            }
        },

        "pageLength": 50,
        "colReorder": true,
        dom: 'Bfrtip',
        buttons: [

            {
                extend: 'excel',
                filename: 'kitab-corpusmetadata',
                stripHtml: true,
                exportOptions: { orthogonal: 'rawExport' },
            },
            {
                extend: 'csv',
                filename: 'kitab-corpusmetadata',
                stripHtml: true,
                exportOptions: { orthogonal: 'rawExport' },
            },
            {

                text: 'Primary Books Only',
                className: 'btn btn-light',
                action: function (e, dt, node, config) {

                    $.fn.dataTable.ext.search.push(
                        function (settings, data, dataIndex) {
                            //console.log(data[7])
                            return data[7].trim() == 'pri'

                        }
                    )
                    table.draw();
                    $.fn.dataTable.ext.search.pop();
                }
            },


            {
                text: 'All',
                action: function (e, dt, node, config) {
                    table.search("").draw();
                }
            },
        ],
        "deferRender": true,
        //"ajax": "db/OpenITI_metadata_light-isnad-arabic-28052020.json",
        "ajax": {
            'url': url,
            "dataSrc": "data"
        },
        "columns": [
            {
                "data": 'id',
                "render": function (data, type, row) {
                    if (type === 'rawExport') {
                        return data;
                    }

                    topDivOpen = "<div class='bookID' style='float:right'>"
                    TopDivClosed = "</div>"

                    // make Github yml URL
                    //Author from versionUri - taking the first part which give author with date e.g. 0322CabdAllahMahdi
                    let s = row['url'].replace('https://raw.githubusercontent.com', 'https://github.com')

                    s = s.replace('master/data/', 'blob/master/data/')
                    s = s.replace('.completed', '')
                    s = s.replace('.inProgress', '')
                    s = s.replace('.completed', '')
                    s = s.replace('.mARkdown', '')

                    s = s.replace('-ara1', '-ara1.yml')
                    //console.log(s)

                    f = "<a href ='" + s + "' target=_blank><img src='images/yml.png' height=16 title='" + s + "'/></a>"
                    ymlFile = "<span class='ymlfile'>" + f + "</span>"

                    let cellContent = "";

                    // add color-coded marker for annotation status of the version:
                    let ext = row["url"].split(".")[row["url"].split(".").length - 1];
                    if (ext === 'completed') {
                        cellContent += " <i class='fas fa-record-vinyl " + ext + "' title='Annotation completed'></i>";
                    } else if (ext === 'mARkdown') {
                        cellContent += " <i class='fas fa-record-vinyl " + ext + "' title='Annotation completed and vetted'></i>";
                    } else if (ext === 'inProgress') {
                        cellContent += " <i class='fas fa-record-vinyl " + ext + "' title='Annotation in progress'></i>";
                    } else {
                        cellContent += " <i class='fas fa-record-vinyl not-annotated' title='Not yet annotated'></i>";
                    }

                    // add version ID + link to the full text


                    bookURISpan = '<strong><a href="' + row['url'] + '" target="_blank" title="' + row['url'] + '"> ' + data + '</a>' + ymlFile + '<br/></strong>'


                    // add Arabic title of the book
                    //cellContent += row['title_lat'];

                    // add info about the primary/secondary status of the version:
                    if (row['status'] === 'pri') {
                        bookStatusTag = '<p title="This is the primary version of this text">PRI</p>'
                    } else {
                        bookStatusTag = '<p title="This is a secondary version of this text">SEC</p>'
                    }

                    topDivOpen += cellContent + bookURISpan + bookStatusTag

                    // add links to issues related to this text version:
                    if (row["version_issues"].length > 0) {
                        let tag = '<span class="extant issues">';
                        //console.log(row["id"] + ": ");
                        //console.log(row["version_issues"])
                        row["version_issues"].forEach(function (item) {
                            if (item[1] === "URI change suggestion") {
                                let changeUri = "<a href ='https://github.com/OpenITI/Annotation/issues/" + item[0] + "' target=_blank title='Change URI issue " + item[0] + " on GitHub'> <i class='fas fa-exchange-alt' aria-hidden='true'></i></a>"
                                tag += changeUri;
                            } else if (item[1] === "PRI & SEC Versions") {
                                let priSec = "<a href ='https://github.com/OpenITI/Annotation/issues/" + item[0] + "' target=_blank title='Switch primary/secondary issue " + item[0] + " on GitHub'> <i class='fas fa-sync-alt' aria-hidden='true'></i></a>";
                                tag += priSec;
                            } else if (item[1] === "text quality") {
                                let textQual = "<a href ='https://github.com/OpenITI/Annotation/issues/" + item[0] + "' target=_blank title='Text quality issue " + item[0] + " on GitHub'> <i class='fas fa-bug' aria-hidden='true'></i></a>";
                                tag += textQual;
                            }
                        });
                        //cellContent += tag + '</span><br/>';
                        topDivOpen += tag + '</span><br/>';
                    }

                    // add a new div, vertically aligned with the bottom, with links to raise issues:
                    let versionuri = row['url'].split('/')[9];
                    let opentag = '<span class="issues">';
                    let textQuality = "<a href='https://github.com/OpenITI/Annotation/issues/new?assignees=&labels=text+quality&template=text-quality-issue-.md&title=" + versionuri + "'target=_blank title='Full Text Quality Issue - raise issue on GitHub'> <i class='fas fa-bug bug' aria-hidden='true'></i></a>";
                    let inProgress = " <a href='https://github.com/OpenITI/Annotation/issues/new?assignees=&labels=in+progress&template=in-progress.md&title=IN+PROGRESS: " + versionuri + "'target=_blank title='Report Text In Progress  - raise issue on GitHub'> <i class='fas fa-tasks bug' aria-hidden='true'></i></a>";
                    let completedText = "<a href='https://github.com/OpenITI/Annotation/issues/new?assignees=&labels=text+tagged&template=submission-report--for-pull-requests-.md&title=" + versionuri + "'target=_blank title='Report Text Tagged - raise issue on GitHub'> <i class='fas fa-tag bug'aria-hidden='true' ></i></a>";
                    let changeUri = issueURItempl + versionuri + "' target=_blank title='Change URI - raise issue on GitHub'> <i class='fas fa-exchange-alt bug' aria-hidden='true'></i></a>";
                    let priSec = "<a href='https://github.com/OpenITI/Annotation/issues/new?assignees=&labels=PRI+%26+SEC+Versions&template=pri-vs-sec.md&title=" + versionuri + "'target=_blank title='Request change of primary text - raise issue on GitHub'> <i class='fas fa-sync-alt bug' aria-hidden='true'></i></a>";
                    let endtag = '</span>';
                    //var isnadbar = "<div class='isnad-bar-outer'><div class='isnad-bar-inner'> Isnad Tag Count: " + row['Isnad Tag Count'] + "<br/> Fraction: " + (parseFloat(row['Isnad Fraction']) * 100).toFixed(3) + "%</div></div>"
                    return topDivOpen + '<div class="add-issue">Raise a version issue <br/>' + opentag + changeUri + textQuality + completedText + inProgress + priSec + endtag + TopDivClosed + "</div>";
                }
            },

            {
                "data": "book",
                "render": function (data, type, row, meta) {

                    if (type === 'rawExport') {
                        return data;
                    }



                    // make link to raise issue with the book title URI:
                    let split_url = row['url'].split('/');
                    let versionuri = split_url[split_url.length - 1];
                    let bookuri = versionuri.split(".").slice(0, 2).join(".");

                    let cellContent = "<div style='position:relative'><div style='float:right'><strong>"

                    // make link to book folder on GitHub:
                    d = data.substring(0, 4);
                    d = pad(Math.ceil(d / 25) * 25, 4)
                    bookFolderUrl = 'https://github.com/OpenITI/' + d + 'AH' + '/tree/master/data/' + data.split(".")[0] + "/" + data
                    //console.log(bookFolderUrl)
                    cellContent += '<a href="' + bookFolderUrl + '" target="_blank" title="' + bookFolderUrl + '">'

                    let link = bookFolderUrl + '/' + data + '.yml';
                    let modalButton = "";
                    let hiddenDiv = "";

                    // add a hidden div with button to a popup modal:
                    if (bookRelations.hasOwnProperty(bookuri)) {
                      //var relDiv = '<div class="bookRelShort">';
                      //... : add related book URIs
                      //modalButton = '<button type="button" onclick="fillModal(\''+bookuri+'\')">Book relations</button>';
                      //relDiv += modalButton + "</div>"
                      modalButton = '<img src="images/bookRel.png" height="16" title="book relations" onclick="fillModal(\''+bookuri+'\')"></img>';
                      hiddenDiv = '<div style="display: none;">';
                      //hiddenDiv += bookRelations[bookuri];
                      let hiddenDivStr = "Book relations: ";
                      for (let i = 0; i < bookRelations[bookuri].length; i++) {
                        let relObj = bookRelations[bookuri][i];
                        if (relObj["source"] !== bookuri){
                          if (!hiddenDivStr.includes(relObj["source"])){
                            hiddenDivStr += " " + relObj["source"] + "(" + relObj["main_rel_type"] + "." + relObj["sec_rel_type"] + ")";
                          }
                        }
                        if (relObj["dest"] !== bookuri){
                          if (!hiddenDivStr.includes(relObj["dest"])){
                            hiddenDivStr += " " + relObj["dest"] + "(" + relObj["main_rel_type"] + "." + relObj["sec_rel_type"] + ")";
                          }
                        }
                      }
                      hiddenDiv += hiddenDivStr + '</div>';
                      //cellContent = cellContent + relDiv + hiddenDiv;
                    } 

                    f = "<a href ='" + link + "' target=_blank><img src='images/yml.png' height=16 title='" + link + "'/></a>"
                    let ymlFile = '<span class=ymlfile>' + f + modalButton + '</span>' + hiddenDiv

                    // make Latin version of book title and add to cellContent:
                    let i = data.indexOf('.')
                    data = data.substring(i + 1);
                    data = data.replace(/([A-Z])/g, ' $1').trim();
                    //cellContent += data + '</a><br/></strong>' + row['title'].split("::")[1];
                    cellContent += data + '</a>' + ymlFile + '<br/></strong>' + row['title_ar'];

                    //
                    if (row["book_issues"].length > 0) {
                        let tag = '<span class="extant issues">';
                        row["book_issues"].forEach(function (item) {
                            if (item[1] === "URI change suggestion") {
                                let changeUri = "<a href ='https://github.com/OpenITI/Annotation/issues/" + item[0] + "' target=_blank title='Change URI issue " + item[0] + " on GitHub'> <i class='fas fa-exchange-alt' aria-hidden='true'></i></a>"
                                tag += changeUri;
                            } else if (item[1] === "text quality") {
                                let textQual = "<a href ='https://github.com/OpenITI/Annotation/issues/" + item[0] + "' target=_blank title='Text quality issue " + item[0] + " on GitHub'> <i class='fas fa-bug' aria-hidden='true'></i></a>";
                                tag += textQual;
                                //console.log("Text quality issue: "+row["book"]);
                            }
                        });
                        cellContent += "<br/>" + tag + '</span>';
                    }

                    // close first part of the cell content,
                    // to be vertically aligned with the top of the cell
                    cellContent += '<br/><br/></div></div>';


                    let intro = '<div class="add-issue">Raise a book title issue<br/>';
                    let opentag = '<span class="issues">';
                    let changeUri = issueURItempl + bookuri + "' target=_blank title='Change title URI - raise issue on GitHub'>";
                    changeUri += " <i class='fas fa-exchange-alt bug' aria-hidden='true'></i></a>";
                    //let endtag = '</span>';
                    let endtag = '</span></div>';

                    //return cellContent + intro + opentag + changeUri + endtag;
                    cellContent = cellContent + intro + opentag + changeUri + endtag;

                    //return cellContent + modalDiv;
                    return cellContent
                }
            },

            {
                "data": "author_lat",
                "render": function (data, type, row, meta) {

                    if (type === 'rawExport') {
                        return data;
                    }
                    topDivOpen = "<div class='bookID' style='float:right'>"
                    TopDivClosed = "</div>"

                    //Author from versionUri - taking the first part which give author with date e.g. 0322CabdAllahMahdi
                    s = row['versionUri'].split('.')[0]

                    //Get the date 4 characters
                    d = row['versionUri'].substring(0, 4);

                    // pad it to get 25 year repos
                    d = pad(Math.ceil(d / 25) * 25, 4)
                    df = 'https://github.com/OpenITI/' + d + 'AH' + '/blob/master/data/' + s + '/' + s + '.yml'
                    //a = 'https://raw.githubusercontent.com/OpenITI/' + d + 'AH' + '/master/data/' + s + '/' + s + '.yml'
                    s = s.replace(/([A-Z])/g, ' $1').trim();
                    f = "<a href ='" + df + "' target=_blank><img src='images/yml.png' height=16 title='" + df + "'/></a>"
                    ymlFile = '<span class=ymlfile>' + f + '</span>'

                    // make link to author folder on GitHub:
                    d = row["book"].substring(0, 4);
                    d = pad(Math.ceil(d / 25) * 25, 4);
                    authorUrl = 'https://github.com/OpenITI/' + d + 'AH' + '/tree/master/data/' + row["book"].split(".")[0];
                    d = checknull(data);
                    let authorLink = '<strong><a href="' + authorUrl + '" target="_blank" title="' + authorUrl + '">';
                    authorLink += d.split("::")[0] + '</a></strong>';
                    let authorDiv = "<div class='author text-wrap;' style='float:right;'>" + authorLink + ymlFile + "<br/>";

                    // add the Arabic version(s) of the author name:
                    if (row["author_ar"].length > 0) {
                        authorDiv += row["author_ar"];
                    }

                    // add links to GitHub issues related to the author uri:
                    if (row["author_issues"].length > 0) {
                        let tag = '<span class="extant issues">';
                        row["author_issues"].forEach(function (item) {
                            if (item[1] === "URI change suggestion") {
                                let issueUri = "<a href ='https://github.com/OpenITI/Annotation/issues/" + item[0];
                                issueUri += "' target=_blank title='Change URI issue " + item[0] + " on GitHub'>";
                                issueUri += " <i class='fas fa-exchange-alt' aria-hidden='true'></i></a>";
                                tag += issueUri;
                            }
                        });
                        authorDiv += "<br/>" + tag + '</span>';
                    }

                    // Close the first div of the cell,
                    // to be aligned vertically with the top of the cell:
                    authorDiv += '<br/><br/><br/></div>';



                    // Add link to raise issues about the author URI:
                    let split_url = row['url'].split('/');
                    let versionuri = split_url[split_url.length - 1];
                    let authoruri = versionuri.split(".")[0];
                    let intro = '<div class="add-issue">Raise an author issue <br/>';
                    let opentag = '<span class="issues">';
                    let changeUri = issueURItempl + authoruri + "' target=_blank title='Change URI - raise issue on GitHub'>";
                    changeUri += " <i class='fas fa-exchange-alt bug' aria-hidden='true'></i></a>";
                    let endtag = '</span>';

                    return authorDiv + intro + opentag + changeUri + endtag;
                }
            },

            {
                "data": "date",
                render: function (data) {

                    return "<div class='text-wrap'>" + checknull(data) + "</div>";
                }
            },

            {
                "data": "tok_length",
                render: function (data) {
                    return "<div class='text-wrap'>" + checknull(data) + "</div>";
                }
            },

            {
                "data": "ed_info",
                "render": function (data, type, row, meta) {
                    data = checknull(data);
                    if (data == "") {
                        return data;
                    } else {
                        return '<div class="editor">' + data + '</div><br/>';
                    }
                }
            },

            {
                "data": "tags",
                "render": function (data, type, row, meta) {
                    /*                    tags = data.replace(/;_|_|;/g, "; ");
                                        Atags = checknull(row['classification']);
                                        Atags = Atags.replace(/::|_|;/g, ":: ");

                                        return "<div class='tag text-wrap'>" + tags + "<br/>" + Atags + "</div>";
                                        */
                    tags = checknull(data);
                    tags = tags.replace(/;|_/g, "");
                    return "<div class='tag text-wrap'>" + tags + "</div>";
                }

            },



            {
                "data": "status",
                "visible": false
            },

            {
                "data": "url",
                "visible": false
            },



        ]

    });

    table.on('xhr', function () {
        let json = table.ajax.json();
        //alert( json.data.length +' row(s) were loaded' );
        if (json['date']) {
            dt = json['date'] + " - " + json['time']
            document.getElementById("timestamp").innerHTML = "Last updated on : " + dt;
            console.log(dt)
        }
    });

    $('#inProgressFilter').on('click', function () {
        table.search("inProgress").draw();
    });

    $('#AnnotationCompletedFilter').on('click', function () {
        table.search("completed").draw();
    });

    $('#AnnotationVettedFilter').on('click', function () {
        table.search("mARkdown").draw();
    });

    $('#notYetAnnotatedFilter').on('click', function () {
        console.log("filtering...");
        table.search("(?<!mARkdown|completed|inProgress)$", true).draw();
    });

});
