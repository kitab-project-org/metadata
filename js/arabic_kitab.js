var table;
const url = "https://raw.githubusercontent.com/OpenITI/kitab-metadata-automation/master/output/OpenITI_Github_clone_metadata_light.json?v1"
var issueURItempl = "<a href ='https://github.com/OpenITI/Annotation/issues/new?";
issueURItempl += "assignees=&labels=URI+change+suggestion&template=change-uri.md&title=";
//url ="db/OpenITI_metadata_light-isnad-arabic-28052020.json"
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

        "order": [[ 3, "asc" ]],
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
                            //console.log(data[8])
                            return data[8].trim() == 'pri'

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
                    s = row['url'].replace('https://raw.githubusercontent.com', 'https://github.com')

                    s = s.replace('master/data/','blob/master/data/')
                    s= s.replace('.completed','')
                    s= s.replace('.inProgress','')
                    s=s.replace('.completed','')
                    s=s.replace('.mARkdown','')

                    s = s.replace('-ara1', '-ara1.yml')
                    //console.log(s)

                    f = "<a href ='" + s + "' target=_blank><img src='images/yml.png' height=16 title='" +  s +  "'/></a>"
                    ymlFile = "<span class='ymlfile'>" + f + "</span>"

                    let reader = "<a href='http://dev.kitab-project.org/lite-reader/" + row['versionUri'] + "' class='reader' target='_blank'><i class='fa fa-book' aria-hidden='true' title='Read the book'></i></a>"

                    //var fileDownload = "<a href='" + row['url'] + "' target='_blank' download><i class='fas fa-file-download' aria-hidden='true' title='Download the text'></i></a>"

                    // add color-coded marker for annotation status of the version:
                    let ext = row["url"].split(".")[row["url"].split(".").length - 1];
                    let cellContent = "";
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



                    //bookURISpan = '<strong><a href="' + row['url'] + '" target="_blank" title="' + row['url'] + '"> ' + data + '</a>' + ymlFile + reader + fileDownload + '<br/></strong>'
                    bookURISpan = '<strong><a href="' + row['url'] + '" target="_blank" title="' + row['url'] + '"> ' + data + '</a>' + ymlFile + reader + '<br/></strong>'


                    // add Arabic title of the book
                    //cellContent += row['title_lat'];

                    // add info about the primary/secondary status of the version:
                    if (row['status'] === 'pri') {
                        bookStatusTag = '<p title="This is the primary version of this text">PRI</p>'
                    } else {
                        bookStatusTag = '<p title="This is the secondary version of this text">SEC</p>'
                    }

                    topDivOpen += cellContent + bookURISpan  + bookStatusTag

                    // add links to issues related to this text version:
                    if (row["version_issues"].length > 0) {
                        let tag = '<span class="extant issues">';
                        //console.log(row["book"] + ": ");
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
                        //cellContent += tag + '<br/></span>';
                        topDivOpen += tag + '<br/></span>';
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

                    let cellContent = "<div style='float:right'><strong>"

                    // make link to book folder on GitHub:
                    d = data.substring(0, 4);
                    d = pad(Math.ceil(d / 25) * 25, 4)
                    bookFolderUrl = 'https://github.com/OpenITI/' + d + 'AH' + '/tree/master/data/' + data.split(".")[0] + "/" + data
                    //console.log(bookFolderUrl)
                    cellContent += '<a href="' + bookFolderUrl + '" target="_blank" title="' + bookFolderUrl + '">'

                    let link = bookFolderUrl+'/'+data+'.yml';

                    f = "<a href ='" + link + "' target=_blank><img src='images/yml.png' height=16 title='" +  link +  "'/></a>"
                    let ymlFile = '<span class=ymlfile>' + f + '</span>'

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
                    cellContent += '<br/><br/></div>'

                    // make link to raise issue with the book title URI:
                    let split_url = row['url'].split('/');
                    let versionuri = split_url[split_url.length - 1];
                    let bookuri = versionuri.split(".").slice(0, 2).join(".");
                    let intro = '<div class="add-issue">Raise a book title issue<br/>';
                    let opentag = '<span class="issues">';
                    let changeUri = issueURItempl + bookuri + "' target=_blank title='Change title URI - raise issue on GitHub'>";
                    changeUri += " <i class='fas fa-exchange-alt bug' aria-hidden='true'></i></a>";
                    let endtag = '</span>';

                    return cellContent + intro + opentag + changeUri + endtag;
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
                     df = 'https://github.com/OpenITI/' + d+ 'AH' + '/blob/master/data/' + s + '/' + s + '.yml'
                     //a = 'https://raw.githubusercontent.com/OpenITI/' + d + 'AH' + '/master/data/' + s + '/' + s + '.yml'
                     s = s.replace(/([A-Z])/g, ' $1').trim();
                     f = "<a href ='" + df + "' target=_blank><img src='images/yml.png' height=16 title='" +  df +  "'/></a>"
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
                "data": "srts",
                "render": function (data, type, row, meta) {

                    let cellContent = "";
                    for (let i = 0; i < data.length; i++) {
                        cellContent += '<a href="' + data[i][1] + '" target="_blank">';
                        cellContent += data[i][0] + '</a><br/>'
                        //console.log(cellContent)

                    }

                    return '<div class="LTR">' + cellContent + '</div>'
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
