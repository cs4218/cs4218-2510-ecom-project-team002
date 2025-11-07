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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 2250, 0, 0.0, 14.269333333333327, 0, 146, 10.0, 25.0, 64.44999999999982, 85.0, 6.183068285806149, 585.1176262187515, 1.0928358505291333], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["07b - Test Product Photo Fallback", 150, 0, 0.0, 10.820000000000007, 5, 37, 10.0, 14.0, 21.0, 34.450000000000045, 0.5548137490244525, 2.983749331911777, 0.12299093850444406], "isController": false}, {"data": ["08 - Search Products", 150, 0, 0.0, 10.639999999999999, 5, 25, 10.0, 15.900000000000006, 21.0, 23.980000000000018, 0.5523275081192144, 0.8079947335572102, 0.10787646642953407], "isController": false}, {"data": ["02 - Get Product Count", 150, 0, 0.0, 10.153333333333329, 4, 43, 9.0, 17.0, 21.799999999999955, 39.430000000000064, 0.5639097744360902, 0.16190378289473684, 0.11124001409774437], "isController": false}, {"data": ["Cart Action: Add Novel", 150, 0, 0.0, 0.04000000000000001, 0, 1, 0.0, 0.0, 0.0, 1.0, 0.548666739822232, 0.0, 0.0], "isController": false}, {"data": ["09b - Get Product Details (T-Shirt)", 150, 0, 0.0, 15.84, 9, 46, 15.0, 24.80000000000001, 28.0, 39.37000000000012, 0.5495814021653508, 0.3402681728250316, 0.12397783584003517], "isController": false}, {"data": ["Cart Action: Add Third Product", 150, 0, 0.0, 0.020000000000000004, 0, 1, 0.0, 0.0, 0.0, 1.0, 0.5565449688334817, 0.0, 0.0], "isController": false}, {"data": ["07 - Load Product Photo", 150, 0, 0.0, 15.76, 7, 40, 15.0, 21.0, 27.899999999999977, 38.98000000000002, 0.5589423320564607, 18.597386909663744, 0.12390616150079743], "isController": false}, {"data": ["04 - Load More (Page 2)", 150, 0, 0.0, 10.506666666666666, 5, 66, 9.5, 13.0, 18.899999999999977, 54.27000000000021, 0.5595678643905933, 0.7765097024404619, 0.11092995749149456], "isController": false}, {"data": ["Get Third Product Details", 150, 0, 0.0, 15.786666666666669, 9, 32, 15.0, 23.0, 27.0, 30.980000000000018, 0.5582454716988154, 0.35871632849396534, 0.12593232808830698], "isController": false}, {"data": ["Cart Action: Add T-Shirt", 150, 0, 0.0, 0.05333333333333334, 0, 1, 0.0, 0.0, 1.0, 1.0, 0.553113661169946, 0.0, 0.0], "isController": false}, {"data": ["03 - Get Products Page 1", 150, 0, 0.0, 12.386666666666668, 5, 60, 10.5, 22.0, 26.349999999999966, 52.350000000000136, 0.5589631606012953, 1.1370315073559552, 0.1108100796895146], "isController": false}, {"data": ["09a - Get Product Details (Novel)", 150, 0, 0.0, 16.213333333333335, 9, 37, 15.0, 25.0, 27.0, 33.430000000000064, 0.548648678305334, 0.3262959424686996, 0.12376742645364468], "isController": false}, {"data": ["01 - Get Categories", 150, 0, 0.0, 10.833333333333325, 5, 30, 10.0, 17.0, 22.899999999999977, 28.470000000000027, 0.5663326562511798, 0.7505013813797373, 0.11171796539329915], "isController": false}, {"data": ["05 - Filter by Category", 150, 0, 0.0, 72.62000000000002, 47, 146, 71.5, 88.0, 93.44999999999999, 126.62000000000035, 0.5619050829933807, 755.3672471146174, 0.15803580459188832], "isController": false}, {"data": ["06 - Filter by Price Range", 150, 0, 0.0, 12.366666666666665, 5, 71, 10.0, 22.900000000000006, 29.799999999999955, 56.210000000000264, 0.5609007317884881, 15.807796672082473, 0.14779880350525562], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 2250, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
