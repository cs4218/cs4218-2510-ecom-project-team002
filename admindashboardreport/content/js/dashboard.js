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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 650, 0, 0.0, 20.130769230769257, 0, 121, 12.0, 50.799999999999955, 89.0, 98.0, 4.978706455467385, 3.7600528580647383, 2.082574359853243], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["12 - Verify Product Cleanup", 50, 0, 0.0, 24.14, 14, 48, 22.5, 37.49999999999999, 41.24999999999998, 48.0, 0.6491061807890535, 2.9186831217788107, 0.2649671714549066], "isController": false}, {"data": ["01 - Admin Login for Products", 50, 0, 0.0, 87.96, 62, 121, 92.0, 98.0, 104.24999999999997, 121.0, 0.6521115371573154, 0.40884336606933247, 0.263646656624149], "isController": false}, {"data": ["02 - Generate Random Product Data", 50, 0, 0.0, 4.600000000000001, 1, 36, 4.0, 6.0, 9.449999999999996, 36.0, 0.6645224741500757, 0.0, 0.0], "isController": false}, {"data": ["09 - Product Edit Complete", 50, 0, 0.0, 2.6200000000000006, 0, 39, 2.0, 3.0, 4.449999999999996, 39.0, 0.6601705880799599, 0.11148115047928385, 0.0], "isController": false}, {"data": ["10 - Delete Product", 50, 0, 0.0, 16.140000000000004, 10, 31, 15.0, 24.0, 25.89999999999999, 31.0, 0.6502711630750023, 0.2057498601916999, 0.29719424249912213], "isController": false}, {"data": ["13 - Product Cleanup Verification Results", 50, 0, 0.0, 2.8400000000000003, 1, 16, 2.0, 4.0, 5.0, 16.0, 0.659108884787767, 0.19842781933825468, 0.0], "isController": false}, {"data": ["08 - Edit Product", 50, 0, 0.0, 44.64, 30, 70, 44.0, 56.9, 59.79999999999998, 70.0, 0.6732465294141409, 0.49033912269244756, 1.1339996229819436], "isController": false}, {"data": ["05 - Verify Created Product", 50, 0, 0.0, 22.399999999999995, 13, 40, 22.0, 32.0, 37.449999999999996, 40.0, 0.6776353237741577, 0.5033824590708265, 0.29953598921204566], "isController": false}, {"data": ["11 - Complete Product CRUD Operations", 50, 0, 0.0, 2.22, 0, 5, 2.0, 4.0, 4.0, 5.0, 0.6439896446465141, 0.18084537325639802, 0.0], "isController": false}, {"data": ["02 - Get Categories for Product", 50, 0, 0.0, 12.539999999999997, 7, 24, 12.0, 17.9, 21.799999999999983, 24.0, 0.6596480118208924, 0.8741624531649912, 0.2705587548484129], "isController": false}, {"data": ["04 - Create New Product", 50, 0, 0.0, 34.28, 21, 60, 33.0, 45.0, 46.89999999999999, 60.0, 0.6659563132658498, 0.4647906816062866, 1.0866794169552478], "isController": false}, {"data": ["06 - Product Creation Complete", 50, 0, 0.0, 2.24, 0, 11, 2.0, 4.0, 5.0, 11.0, 0.6830414469550012, 0.09090321131936287, 0.0], "isController": false}, {"data": ["07 - Generate Updated Product Data", 50, 0, 0.0, 5.08, 0, 69, 2.5, 7.899999999999999, 21.699999999999974, 69.0, 0.6756939376739912, 0.0, 0.0], "isController": false}]}, function(index, item){
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
