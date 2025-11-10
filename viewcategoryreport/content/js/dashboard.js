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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [1.0, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "08 - Search for NUS T-Shirt in Clothing"], "isController": false}, {"data": [1.0, 500, 1500, "01 - User Login"], "isController": false}, {"data": [1.0, 500, 1500, "04 - Filter Products by Category"], "isController": false}, {"data": [1.0, 500, 1500, "02 - Get All Categories"], "isController": false}, {"data": [1.0, 500, 1500, "03 - View Category 1 Products"], "isController": false}, {"data": [1.0, 500, 1500, "06 - Browse Random Category Dropdown (3 Users: Electronics/Clothing/Book)"], "isController": false}, {"data": [1.0, 500, 1500, "05 - View Category 2 Products"], "isController": false}, {"data": [1.0, 500, 1500, "07 - Get Products in Clothing Category"], "isController": false}, {"data": [1.0, 500, 1500, "09 - View NUS T-Shirt Product Details"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 810, 0, 0.0, 27.346913580246948, 5, 112, 13.0, 81.89999999999998, 90.0, 99.88999999999999, 6.190199614832024, 940.504266329995, 1.5529681195167058], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["08 - Search for NUS T-Shirt in Clothing", 90, 0, 0.0, 11.677777777777777, 6, 30, 10.0, 17.900000000000006, 24.0, 30.0, 0.8814973701995122, 0.4794863625011019, 0.1902450379043869], "isController": false}, {"data": ["01 - User Login", 90, 0, 0.0, 86.91111111111114, 59, 112, 88.0, 98.9, 101.45, 112.0, 0.891981090000892, 0.5644567835161894, 0.2621936602444028], "isController": false}, {"data": ["04 - Filter Products by Category", 90, 0, 0.0, 67.04444444444441, 30, 101, 68.0, 83.0, 85.9, 101.0, 0.8931672703815808, 1200.6819704262393, 0.2703924353694239], "isController": false}, {"data": ["02 - Get All Categories", 90, 0, 0.0, 12.366666666666664, 6, 37, 11.0, 20.900000000000006, 28.35000000000001, 37.0, 0.8820243438718909, 1.168854526009918, 0.19294282522197614], "isController": false}, {"data": ["03 - View Category 1 Products", 90, 0, 0.0, 11.511111111111108, 6, 28, 10.0, 17.0, 22.0, 28.0, 0.8885729518393459, 0.3687924848942598, 0.2073915385640661], "isController": false}, {"data": ["06 - Browse Random Category Dropdown (3 Users: Electronics/Clothing/Book)", 90, 0, 0.0, 11.044444444444444, 5, 41, 10.0, 13.0, 22.250000000000014, 41.0, 0.8813937773599319, 0.30249136050474484, 0.20835552119752035], "isController": false}, {"data": ["05 - View Category 2 Products", 90, 0, 0.0, 11.788888888888891, 6, 54, 10.0, 15.0, 24.450000000000003, 54.0, 0.8897676717745922, 0.3571235479485912, 0.20158798813643103], "isController": false}, {"data": ["07 - Get Products in Clothing Category", 90, 0, 0.0, 13.188888888888888, 8, 32, 13.0, 17.900000000000006, 19.900000000000006, 32.0, 0.8759550343082388, 16.46607271035087, 0.26518169983940826], "isController": false}, {"data": ["09 - View NUS T-Shirt Product Details", 90, 0, 0.0, 20.588888888888892, 11, 66, 19.0, 30.900000000000006, 33.80000000000001, 66.0, 0.891565787648842, 0.5824780390010501, 0.20286604347869158], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 810, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
