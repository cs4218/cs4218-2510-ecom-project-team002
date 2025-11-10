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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [1.0, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "01 - User Role Assignment"], "isController": false}, {"data": [1.0, 500, 1500, "07 - Profile Update Completion"], "isController": false}, {"data": [1.0, 500, 1500, "06 - Update Profile"], "isController": false}, {"data": [1.0, 500, 1500, "04 - Use Profile Information from Login"], "isController": false}, {"data": [1.0, 500, 1500, "Admin Navigate to Cart Page"], "isController": false}, {"data": [1.0, 500, 1500, "02 - User Login"], "isController": false}, {"data": [1.0, 500, 1500, "User Navigate to Dashboard"], "isController": false}, {"data": [1.0, 500, 1500, "05 - Prepare Profile Updates"], "isController": false}, {"data": [1.0, 500, 1500, "Admin Click Update Address"], "isController": false}, {"data": [1.0, 500, 1500, "08 - Final Profile Management Report"], "isController": false}, {"data": [1.0, 500, 1500, "User Click Profile"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 135, 0, 0.0, 12.792592592592593, 0, 106, 1.0, 69.80000000000007, 91.39999999999998, 102.75999999999988, 14.272121788772598, 4.47614375198224, 1.34410267337985], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["01 - User Role Assignment", 15, 0, 0.0, 2.8, 1, 8, 2.0, 6.200000000000001, 8.0, 8.0, 1.6051364365971108, 0.21945224719101122, 0.0], "isController": false}, {"data": ["07 - Profile Update Completion", 15, 0, 0.0, 1.2666666666666668, 0, 3, 1.0, 3.0, 3.0, 3.0, 1.6270745200130166, 0.31736427486712226, 0.0], "isController": false}, {"data": ["06 - Update Profile", 15, 0, 0.0, 19.599999999999998, 15, 31, 19.0, 27.400000000000002, 31.0, 31.0, 1.621796951021732, 1.0778192236998594, 0.9045530260028111], "isController": false}, {"data": ["04 - Use Profile Information from Login", 15, 0, 0.0, 0.9333333333333336, 0, 3, 1.0, 2.4000000000000004, 3.0, 3.0, 1.6235523325035177, 0.2762998565862106, 0.0], "isController": false}, {"data": ["Admin Navigate to Cart Page", 6, 0, 0.0, 1.1666666666666665, 1, 2, 1.0, 2.0, 2.0, 2.0, 1.86046511627907, 0.24527616279069767, 0.0], "isController": false}, {"data": ["02 - User Login", 15, 0, 0.0, 86.8, 64, 106, 91.0, 100.60000000000001, 106.0, 106.0, 1.5976142294174034, 1.044169872989669, 0.46305849930770054], "isController": false}, {"data": ["User Navigate to Dashboard", 9, 0, 0.0, 0.5555555555555556, 0, 1, 1.0, 1.0, 1.0, 1.0, 1.680672268907563, 0.22923231792717086, 0.0], "isController": false}, {"data": ["05 - Prepare Profile Updates", 15, 0, 0.0, 1.0000000000000002, 0, 3, 1.0, 2.4000000000000004, 3.0, 3.0, 1.6242555495397943, 0.3917882038440715, 0.0], "isController": false}, {"data": ["Admin Click Update Address", 6, 0, 0.0, 0.8333333333333334, 0, 2, 1.0, 2.0, 2.0, 2.0, 1.8610421836228288, 0.33804086538461536, 0.0], "isController": false}, {"data": ["08 - Final Profile Management Report", 15, 0, 0.0, 1.2666666666666668, 0, 3, 1.0, 2.4000000000000004, 3.0, 3.0, 1.6276041666666667, 0.7352828979492189, 0.0], "isController": false}, {"data": ["User Click Profile", 9, 0, 0.0, 0.5555555555555556, 0, 1, 1.0, 1.0, 1.0, 1.0, 1.680672268907563, 0.2866771708683473, 0.0], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 135, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
