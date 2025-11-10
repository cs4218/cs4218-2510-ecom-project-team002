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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [1.0, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "12 - Verify Product Cleanup"], "isController": false}, {"data": [1.0, 500, 1500, "01 - Admin Login for Products"], "isController": false}, {"data": [1.0, 500, 1500, "02 - Generate Random Product Data"], "isController": false}, {"data": [1.0, 500, 1500, "09 - Product Edit Complete"], "isController": false}, {"data": [1.0, 500, 1500, "10 - Delete Product"], "isController": false}, {"data": [1.0, 500, 1500, "13 - Product Cleanup Verification Results"], "isController": false}, {"data": [1.0, 500, 1500, "08 - Edit Product"], "isController": false}, {"data": [1.0, 500, 1500, "05 - Verify Created Product"], "isController": false}, {"data": [1.0, 500, 1500, "11 - Complete Product CRUD Operations"], "isController": false}, {"data": [1.0, 500, 1500, "02 - Get Categories for Product"], "isController": false}, {"data": [1.0, 500, 1500, "04 - Create New Product"], "isController": false}, {"data": [1.0, 500, 1500, "06 - Product Creation Complete"], "isController": false}, {"data": [1.0, 500, 1500, "07 - Generate Updated Product Data"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 650, 0, 0.0, 19.79538461538461, 0, 113, 11.0, 48.0, 89.0, 96.49000000000001, 4.737920125955784, 3.646305037320232, 1.9836125479258844], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["12 - Verify Product Cleanup", 50, 0, 0.0, 24.78, 16, 40, 23.5, 32.0, 36.24999999999998, 40.0, 0.5853841290654928, 2.7273069439728848, 0.23895563080993748], "isController": false}, {"data": ["01 - Admin Login for Products", 50, 0, 0.0, 89.62, 62, 113, 92.0, 97.0, 102.35, 113.0, 0.6181386608644052, 0.4020315899762634, 0.24991152890416377], "isController": false}, {"data": ["02 - Generate Random Product Data", 50, 0, 0.0, 3.44, 0, 14, 3.0, 6.0, 7.449999999999996, 14.0, 0.6210177238458386, 0.0, 0.0], "isController": false}, {"data": ["09 - Product Edit Complete", 50, 0, 0.0, 2.3000000000000003, 0, 5, 2.0, 4.0, 4.449999999999996, 5.0, 0.6106199013238239, 0.10324485323750672, 0.0], "isController": false}, {"data": ["10 - Delete Product", 50, 0, 0.0, 16.839999999999996, 9, 35, 15.0, 26.0, 27.449999999999996, 35.0, 0.6185592517907291, 0.19571601326191035, 0.28270090804498166], "isController": false}, {"data": ["13 - Product Cleanup Verification Results", 50, 0, 0.0, 3.0600000000000005, 1, 13, 3.0, 4.0, 4.449999999999996, 13.0, 0.5810980428617917, 0.1749422897006183, 0.0], "isController": false}, {"data": ["08 - Edit Product", 50, 0, 0.0, 41.97999999999999, 31, 55, 42.5, 51.0, 54.449999999999996, 55.0, 0.6062663691919682, 0.44163899944829765, 1.0220206365493745], "isController": false}, {"data": ["05 - Verify Created Product", 50, 0, 0.0, 21.299999999999997, 14, 47, 19.0, 29.799999999999997, 37.34999999999999, 47.0, 0.6291761567403641, 0.4674827998968151, 0.2781155230341391], "isController": false}, {"data": ["11 - Complete Product CRUD Operations", 50, 0, 0.0, 2.280000000000001, 0, 6, 2.0, 4.0, 5.0, 6.0, 0.6043245464544279, 0.16983644333853054, 0.0], "isController": false}, {"data": ["02 - Get Categories for Product", 50, 0, 0.0, 12.560000000000002, 7, 32, 12.0, 18.799999999999997, 27.349999999999987, 32.0, 0.6303500964435648, 0.835336993040935, 0.25854203174443086], "isController": false}, {"data": ["04 - Create New Product", 50, 0, 0.0, 34.36000000000001, 22, 70, 31.5, 49.49999999999999, 61.04999999999996, 70.0, 0.6258840612364965, 0.4369208616545871, 1.0234426831023822], "isController": false}, {"data": ["06 - Product Creation Complete", 50, 0, 0.0, 2.0399999999999996, 0, 6, 2.0, 4.0, 4.449999999999996, 6.0, 0.6267313453415059, 0.08340912865541057, 0.0], "isController": false}, {"data": ["07 - Generate Updated Product Data", 50, 0, 0.0, 2.7800000000000002, 0, 6, 3.0, 4.899999999999999, 5.0, 6.0, 0.6214190725941761, 0.0, 0.0], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 650, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
