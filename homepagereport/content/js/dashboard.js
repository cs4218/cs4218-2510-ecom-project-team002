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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [1.0, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "07b - Test Product Photo Fallback"], "isController": false}, {"data": [1.0, 500, 1500, "08 - Search Products"], "isController": false}, {"data": [1.0, 500, 1500, "02 - Get Product Count"], "isController": false}, {"data": [1.0, 500, 1500, "Cart Action: Add Novel"], "isController": false}, {"data": [1.0, 500, 1500, "09b - Get Product Details (T-Shirt)"], "isController": false}, {"data": [1.0, 500, 1500, "Cart Action: Add Third Product"], "isController": false}, {"data": [1.0, 500, 1500, "07 - Load Product Photo"], "isController": false}, {"data": [1.0, 500, 1500, "04 - Load More (Page 2)"], "isController": false}, {"data": [1.0, 500, 1500, "Get Third Product Details"], "isController": false}, {"data": [1.0, 500, 1500, "Cart Action: Add T-Shirt"], "isController": false}, {"data": [1.0, 500, 1500, "03 - Get Products Page 1"], "isController": false}, {"data": [1.0, 500, 1500, "09a - Get Product Details (Novel)"], "isController": false}, {"data": [1.0, 500, 1500, "01 - Get Categories"], "isController": false}, {"data": [1.0, 500, 1500, "05 - Filter by Category"], "isController": false}, {"data": [1.0, 500, 1500, "06 - Filter by Price Range"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 9000, 0, 0.0, 16.384111111111125, 0, 155, 11.0, 39.0, 57.0, 93.0, 26.366981507956968, 2508.99007354099, 4.660209487499121], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["07b - Test Product Photo Fallback", 600, 0, 0.0, 17.17666666666667, 7, 124, 11.0, 35.0, 57.0, 93.99000000000001, 2.432291096598441, 13.080690497038685, 0.5391895302029747], "isController": false}, {"data": ["08 - Search Products", 600, 0, 0.0, 16.213333333333324, 6, 124, 10.0, 30.0, 53.0, 90.0, 2.4258694720499405, 3.5487817081355577, 0.473802631259754], "isController": false}, {"data": ["02 - Get Product Count", 600, 0, 0.0, 11.139999999999997, 5, 62, 9.0, 18.0, 23.0, 32.98000000000002, 2.425810625050538, 0.6964729724266192, 0.478529049082235], "isController": false}, {"data": ["Cart Action: Add Novel", 600, 0, 0.0, 0.009999999999999997, 0, 1, 0.0, 0.0, 0.0, 0.9900000000000091, 2.4270568295356636, 0.0, 0.0], "isController": false}, {"data": ["09b - Get Product Details (T-Shirt)", 600, 0, 0.0, 23.905000000000026, 11, 112, 18.0, 35.89999999999998, 72.94999999999993, 104.97000000000003, 2.428648335768728, 1.5036748485130602, 0.5478689116822033], "isController": false}, {"data": ["Cart Action: Add Third Product", 600, 0, 0.0, 0.006666666666666668, 0, 1, 0.0, 0.0, 0.0, 0.0, 2.397113874894627, 0.0, 0.0], "isController": false}, {"data": ["07 - Load Product Photo", 600, 0, 0.0, 17.740000000000006, 6, 101, 12.0, 31.0, 48.849999999999795, 83.99000000000001, 2.426811412485136, 80.74598792459088, 0.5379747955411385], "isController": false}, {"data": ["04 - Load More (Page 2)", 600, 0, 0.0, 13.169999999999995, 6, 133, 10.0, 23.899999999999977, 30.0, 43.98000000000002, 2.4229697532609134, 3.3623437689294513, 0.4803348241327787], "isController": false}, {"data": ["Get Third Product Details", 600, 0, 0.0, 22.813333333333333, 11, 129, 18.0, 33.0, 53.0, 100.0, 2.4158187813804797, 1.5523523028792534, 0.544974744627823], "isController": false}, {"data": ["Cart Action: Add T-Shirt", 600, 0, 0.0, 0.018333333333333326, 0, 1, 0.0, 0.0, 0.0, 1.0, 2.4183894332504363, 0.0, 0.0], "isController": false}, {"data": ["03 - Get Products Page 1", 600, 0, 0.0, 13.153333333333341, 6, 67, 10.0, 23.0, 31.0, 41.0, 2.4229306153436116, 4.928676241953852, 0.4803270653464387], "isController": false}, {"data": ["09a - Get Product Details (Novel)", 600, 0, 0.0, 25.66500000000001, 11, 125, 18.0, 51.0, 82.94999999999993, 102.99000000000001, 2.4177560000644736, 1.4379037148820941, 0.5454117539207943], "isController": false}, {"data": ["01 - Get Categories", 600, 0, 0.0, 11.750000000000007, 6, 97, 10.0, 19.0, 22.949999999999932, 33.99000000000001, 2.4421316553175383, 3.2363014221346673, 0.4817486273184987], "isController": false}, {"data": ["05 - Filter by Category", 600, 0, 0.0, 55.78166666666665, 28, 155, 52.0, 78.0, 90.0, 122.97000000000003, 2.4267427046047443, 3262.262634229206, 0.6825213856700844], "isController": false}, {"data": ["06 - Filter by Price Range", 600, 0, 0.0, 17.21833333333333, 5, 127, 11.0, 34.0, 49.0, 88.0, 2.4203014888887995, 87.24447462187833, 0.6376690807493254], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 9000, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
