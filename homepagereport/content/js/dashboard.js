/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [1.0, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "07b - Test Product Photo Fallback"], "isController": false}, {"data": [1.0, 500, 1500, "02 - Get Product Count"], "isController": false}, {"data": [1.0, 500, 1500, "03 - Get Products Page 1"], "isController": false}, {"data": [1.0, 500, 1500, "01 - Get Categories"], "isController": false}, {"data": [1.0, 500, 1500, "05 - Filter by Category"], "isController": false}, {"data": [1.0, 500, 1500, "10 - Search Products"], "isController": false}, {"data": [1.0, 500, 1500, "07 - Load Product Photo"], "isController": false}, {"data": [1.0, 500, 1500, "06 - Filter by Price Range"], "isController": false}, {"data": [1.0, 500, 1500, "04 - Load More (Page 2)"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 1350, 0, 0.0, 25.897037037036984, 5, 350, 11.0, 77.0, 88.0, 165.47000000000003, 8.803046506168654, 1391.0132535774603, 1.9312065349578758], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["07b - Test Product Photo Fallback", 150, 0, 0.0, 17.32, 6, 97, 10.0, 39.200000000000045, 70.89999999999998, 96.49000000000001, 1.1978725783009376, 6.442074500686781, 0.2655440188225711], "isController": false}, {"data": ["02 - Get Product Count", 150, 0, 0.0, 15.666666666666668, 5, 92, 9.0, 31.900000000000006, 71.69999999999993, 90.47000000000003, 1.2136707877532527, 0.348456261327594, 0.23941552649038772], "isController": false}, {"data": ["03 - Get Products Page 1", 150, 0, 0.0, 15.473333333333331, 5, 121, 10.0, 27.700000000000017, 55.499999999999886, 109.27000000000021, 1.2199485994990078, 2.481594660894954, 0.2418452790022447], "isController": false}, {"data": ["01 - Get Categories", 150, 0, 0.0, 16.84000000000001, 5, 292, 10.0, 28.80000000000001, 57.69999999999993, 205.81000000000154, 1.198992846009352, 1.5888996992526276, 0.2365200731385636], "isController": false}, {"data": ["05 - Filter by Category", 150, 0, 0.0, 95.02666666666663, 51, 350, 81.0, 147.80000000000007, 176.5999999999999, 348.98, 1.2322453975634402, 1656.503637177665, 0.3465690180647175], "isController": false}, {"data": ["10 - Search Products", 150, 0, 0.0, 18.433333333333344, 5, 117, 10.0, 42.70000000000002, 73.44999999999999, 108.33000000000015, 1.1956287811760204, 1.749074134962577, 0.2335212463234415], "isController": false}, {"data": ["07 - Load Product Photo", 150, 0, 0.0, 22.313333333333333, 9, 104, 15.0, 42.80000000000001, 76.14999999999992, 98.90000000000009, 1.2066995961578684, 40.149865176459706, 0.2675007893826525], "isController": false}, {"data": ["06 - Filter by Price Range", 150, 0, 0.0, 17.293333333333322, 5, 227, 10.0, 35.0, 46.799999999999955, 155.09000000000128, 1.2166436856192715, 39.77271575148025, 0.32055709607429633], "isController": false}, {"data": ["04 - Load More (Page 2)", 150, 0, 0.0, 14.70666666666667, 5, 87, 9.0, 27.900000000000006, 47.89999999999998, 79.35000000000014, 1.2360837570353767, 1.7153076354953811, 0.2450439479279116], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 1350, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
