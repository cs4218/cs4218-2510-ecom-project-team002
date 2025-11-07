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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 135, 0, 0.0, 11.89629629629629, 0, 104, 1.0, 74.4, 85.19999999999999, 98.95999999999981, 14.27061310782241, 4.484651658298096, 1.3448896670190273], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["01 - User Role Assignment", 15, 0, 0.0, 4.199999999999999, 1, 10, 4.0, 8.8, 10.0, 10.0, 1.6042780748663101, 0.21933489304812834, 0.0], "isController": false}, {"data": ["07 - Profile Update Completion", 15, 0, 0.0, 1.0, 0, 3, 1.0, 3.0, 3.0, 3.0, 1.6302575806977502, 0.31798513748505597, 0.0], "isController": false}, {"data": ["06 - Update Profile", 15, 0, 0.0, 14.266666666666667, 12, 29, 13.0, 22.400000000000006, 29.0, 29.0, 1.6270745200130166, 1.082279972068554, 0.908449940340601], "isController": false}, {"data": ["04 - Use Profile Information from Login", 15, 0, 0.0, 1.0666666666666669, 0, 3, 1.0, 2.4000000000000004, 3.0, 3.0, 1.628310898827616, 0.2795479062635693, 0.0], "isController": false}, {"data": ["Admin Navigate to Cart Page", 6, 0, 0.0, 1.0, 0, 2, 1.0, 2.0, 2.0, 2.0, 1.876172607879925, 0.2473469746716698, 0.0], "isController": false}, {"data": ["02 - User Login", 15, 0, 0.0, 83.40000000000002, 71, 104, 85.0, 95.60000000000001, 104.0, 104.0, 1.5991471215351811, 1.0475662979744136, 0.4635027985074626], "isController": false}, {"data": ["User Navigate to Dashboard", 9, 0, 0.0, 0.5555555555555557, 0, 1, 1.0, 1.0, 1.0, 1.0, 1.6825574873808187, 0.22948944896242288, 0.0], "isController": false}, {"data": ["05 - Prepare Profile Updates", 15, 0, 0.0, 1.0, 0, 4, 1.0, 2.8000000000000007, 4.0, 4.0, 1.6286644951140066, 0.39624474077090116, 0.0], "isController": false}, {"data": ["Admin Click Update Address", 6, 0, 0.0, 0.8333333333333334, 0, 2, 1.0, 2.0, 2.0, 2.0, 1.8773466833541927, 0.34100242490613264, 0.0], "isController": false}, {"data": ["08 - Final Profile Management Report", 15, 0, 0.0, 0.9333333333333336, 0, 2, 1.0, 1.4000000000000004, 2.0, 2.0, 1.6306120230459833, 0.736641720567453, 0.0], "isController": false}, {"data": ["User Click Profile", 9, 0, 0.0, 0.2222222222222222, 0, 1, 0.0, 1.0, 1.0, 1.0, 1.6825574873808187, 0.2869987380818845, 0.0], "isController": false}]}, function(index, item){
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
