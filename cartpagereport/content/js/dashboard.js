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

    var data = {"OkPercent": 89.33333333333333, "KoPercent": 10.666666666666666};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.8911111111111111, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.02, 500, 1500, "08 - Checkout with Updated Cart"], "isController": false}, {"data": [1.0, 500, 1500, "01 - User Login"], "isController": false}, {"data": [1.0, 500, 1500, "02 - Get Products"], "isController": false}, {"data": [1.0, 500, 1500, "07 - Final Cart Summary"], "isController": false}, {"data": [1.0, 500, 1500, "04 - Add Products to Cart"], "isController": false}, {"data": [1.0, 500, 1500, "03 - Initialize Cart"], "isController": false}, {"data": [1.0, 500, 1500, "06 - Remove Item Completely from Cart"], "isController": false}, {"data": [1.0, 500, 1500, "05 - Reduce Item Quantity in Cart"], "isController": false}, {"data": [1.0, 500, 1500, "09 - Cart Operations Summary"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 225, 24, 10.666666666666666, 73.56000000000002, 0, 1284, 5.0, 410.0, 475.8999999999999, 893.3400000000017, 4.464905840096839, 2.3120228131883396, 0.5382498251245212], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["08 - Checkout with Updated Cart", 25, 24, 96.0, 541.8400000000001, 386, 1284, 468.0, 828.4000000000004, 1181.6999999999998, 1284.0, 1.965717880169838, 0.6515279770797295, 1.213216504167322], "isController": false}, {"data": ["01 - User Login", 25, 0, 0.0, 84.92000000000002, 60, 149, 91.0, 94.4, 132.79999999999995, 149.0, 2.601186140880241, 1.6917870799084382, 0.7011009520341275], "isController": false}, {"data": ["02 - Get Products", 25, 0, 0.0, 10.200000000000001, 6, 19, 9.0, 15.0, 17.799999999999997, 19.0, 2.628535380086216, 5.346913278046473, 0.5210866036694354], "isController": false}, {"data": ["07 - Final Cart Summary", 25, 0, 0.0, 2.8800000000000003, 1, 4, 3.0, 4.0, 4.0, 4.0, 2.0418163998693237, 0.6792229867690297, 0.0], "isController": false}, {"data": ["04 - Add Products to Cart", 25, 0, 0.0, 6.28, 1, 22, 5.0, 10.400000000000002, 18.699999999999992, 22.0, 2.2200515051949203, 0.44583143703933936, 0.0], "isController": false}, {"data": ["03 - Initialize Cart", 25, 0, 0.0, 3.16, 1, 8, 3.0, 6.0, 7.399999999999999, 8.0, 2.1006638097638852, 0.15927298651373833, 0.0], "isController": false}, {"data": ["06 - Remove Item Completely from Cart", 25, 0, 0.0, 5.48, 2, 24, 5.0, 7.400000000000002, 19.19999999999999, 24.0, 2.0654329147389294, 0.7072494113516193, 0.0], "isController": false}, {"data": ["05 - Reduce Item Quantity in Cart", 25, 0, 0.0, 4.4799999999999995, 1, 19, 3.0, 10.60000000000002, 18.099999999999998, 19.0, 2.0498524106264346, 0.29154346199573633, 0.0], "isController": false}, {"data": ["09 - Cart Operations Summary", 25, 0, 0.0, 2.8, 0, 5, 3.0, 4.400000000000002, 5.0, 5.0, 2.1712697585548026, 1.1951313346795207, 0.0], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["400/Bad Request", 24, 100.0, 10.666666666666666], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 225, 24, "400/Bad Request", 24, "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["08 - Checkout with Updated Cart", 25, 24, "400/Bad Request", 24, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
