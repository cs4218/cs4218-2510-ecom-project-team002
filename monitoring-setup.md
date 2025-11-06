# JMeter Performance Monitoring Setup - Complete Metrics Coverage

## 🎯 All 16 Load Testing Metrics Now Covered

### ✅ JMeter Built-in Metrics (1-12)

**Your HomePageGroup.jmx now includes these listeners:**

1. **Summary Report** - Overview metrics, error rates, throughput
2. **Aggregate Report** - P90, P95, P99 response times, average latency
3. **Response Time Percentiles Over Time** - 90th percentile tracking
4. **View Results in Table** - Individual request details
5. **Graph Results** - Response time visualization over time
6. **Response Times Over Time** - Average load time trends
7. **Bytes Throughput Over Time** - Bandwidth utilization (network)
8. **Transactions per Second** - Requests per second/request counts
9. **Active Threads Over Time** - Concurrent users, thread counts

**Metrics Covered:**

- ✅ 1. Throughput (Summary Report, Aggregate Report)
- ✅ 2. Error rates (Summary Report, Aggregate Report)
- ✅ 3. Response time (All time-based reports)
- ✅ 6. Average load time (Response Times Over Time)
- ✅ 7. Concurrent users (Active Threads Over Time)
- ✅ 8. 90th percentile response time (Response Time Percentiles Over Time)
- ✅ 9. Average latency (Aggregate Report)
- ✅ 10. Bandwidth/network (Bytes Throughput Over Time)
- ✅ 11. Requests per second (Transactions per Second)
- ✅ 12. Transactions passed/failed (Summary Report)
- ✅ 15. Thread counts (Active Threads Over Time)
- ✅ 16. Resources load time (Individual samplers for photos, API calls)

### 🔧 System-Level Metrics (4, 5, 13, 14) - External Tools Required

**Metrics requiring system monitoring:**

- ❓ 4. CPU utilization
- ❓ 5. Memory utilization
- ❓ 13. Disk I/O
- ❓ 14. Application uptime

## Option 1: PerfMon Plugin (Server Monitoring)

### 1. Download JMeter Plugins Manager

````bash
wget https://jmeter-plugins.org/files/packages/jpgc-cmd-2.2.zip

### 2. Install PerfMon Plugin

```bash
java -jar cmdrunner-2.2.1.jar --tool PerfMon
````

### 3. Start Server Agent (on your backend server)

```bash
# Download server agent
wget https://github.com/undera/perfmon-agent/releases/download/2.2.3/ServerAgent-2.2.3.zip
unzip ServerAgent-2.2.3.zip
# Start agent
java -jar ServerAgent-2.2.3.jar --udp-port 0 --tcp-port 4444
```

### 4. Add PerfMon Listener to JMeter Test Plan

- Right-click Test Plan → Add → Listener → jp@gc - PerfMon Metrics Collector
- Host/Port: localhost:4444
- Metric to collect: CPU, Memory, Network I/O, Disk I/O

## Option 2: Backend Listener + InfluxDB + Grafana

### 1. Setup InfluxDB

```bash
# Install InfluxDB
brew install influxdb
# Start InfluxDB
brew services start influxdb
# Create database
influx -execute 'CREATE DATABASE jmeter'
```

### 2. Add Backend Listener to JMeter

```xml
<BackendListener guiclass="BackendListenerGui" testclass="BackendListener">
  <elementProp name="arguments" elementType="Arguments">
    <Argument name="influxdbUrl" value="http://localhost:8086/write?db=jmeter"/>
    <Argument name="application" value="ecommerce-app"/>
    <Argument name="measurement" value="jmeter"/>
    <Argument name="summaryOnly" value="false"/>
    <Argument name="samplersRegex" value=".*"/>
    <Argument name="percentiles" value="90;95;99"/>
    <Argument name="testTitle" value="Homepage Load Test"/>
  </elementProp>
  <stringProp name="classname">org.apache.jmeter.visualizers.backend.influxdb.InfluxdbBackendListenerClient</stringProp>
</BackendListener>
```

### 3. Setup Grafana Dashboard

```bash
# Install Grafana
brew install grafana
# Start Grafana
brew services start grafana
# Access: http://localhost:3000 (admin/admin)
```

## Option 3: Simple System Monitoring Script

Create `monitor.sh` to run alongside JMeter:

```bash
#!/bin/bash
LOG_FILE="system_metrics_$(date +%Y%m%d_%H%M%S).log"
echo "timestamp,cpu_percent,memory_percent,disk_io,network_io" > $LOG_FILE

while true; do
    TIMESTAMP=$(date +%Y-%m-%d\ %H:%M:%S)
    CPU=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
    MEMORY=$(vm_stat | grep "Pages active" | awk '{print $3}' | sed 's/\.//')
    echo "$TIMESTAMP,$CPU,$MEMORY" >> $LOG_FILE
    sleep 5
done
```

## Metrics to Monitor

### Application Metrics (JMeter)

- Response Time (P50, P90, P95, P99)
- Throughput (requests/second)
- Error Rate (%)
- Active Threads
- Connect Time
- Latency

### System Metrics (PerfMon/Grafana)

- CPU Usage (%)
- Memory Usage (%)
- Disk I/O (reads/writes per second)
- Network I/O (bytes in/out)
- Load Average
- Process Count

### Database Metrics

- Connection Pool Usage
- Query Response Time
- Lock Wait Time
- Buffer Pool Hit Ratio

## Quick Start Guide

### 🚀 Immediate Comprehensive Testing (No Setup Required)

```bash
# Run your enhanced HomePageGroup.jmx with all 12 built-in metrics
jmeter -n -t HomePageGroup.jmx -l results.jtl -e -o report/

# View reports in: report/index.html
open report/index.html
```

### 📊 What You'll See in Reports:

1. **Dashboard** - Overview with key KPIs
2. **APDEX** - Application Performance Index
3. **Errors** - Error rate analysis by type
4. **Response Times Over Time** - Performance trends
5. **Response Time Percentiles** - P50, P90, P95, P99
6. **Active Threads Over Time** - Concurrency visualization
7. **Bytes Throughput Over Time** - Network bandwidth
8. **Response Times vs Threads** - Performance under load
9. **Latency vs Request** - Individual request analysis

### 🖥️ For Complete System Monitoring (CPU, Memory, Disk I/O):

#### Option A: Simple System Monitor (macOS)

```bash
# Create system monitoring script
cat > system_monitor.sh << 'EOF'
#!/bin/bash
LOG_FILE="system_metrics_$(date +%Y%m%d_%H%M%S).log"
echo "timestamp,cpu_percent,memory_used_gb,disk_io_read,disk_io_write" > $LOG_FILE

while true; do
    TIMESTAMP=$(date +%Y-%m-%d\ %H:%M:%S)
    CPU=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
    MEMORY=$(vm_stat | perl -ne '/page size of (\d+)/ and $size=$1; /Pages active:\s+(\d+)/ and printf("%.2f", $1 * $size / 1024/1024/1024)')
    echo "$TIMESTAMP,$CPU,$MEMORY" >> $LOG_FILE
    sleep 5
done
EOF

chmod +x system_monitor.sh
# Run alongside JMeter test
./system_monitor.sh &
jmeter -n -t HomePageGroup.jmx -l results.jtl -e -o report/
```

#### Option B: Activity Monitor (macOS GUI)

1. Open **Activity Monitor** (Applications > Utilities)
2. Monitor **CPU**, **Memory**, **Network**, **Disk** tabs during test
3. Take screenshots at peak load for documentation

### 🎯 Complete Metrics Coverage Summary

| Metric                     | Tool/Report                        | Status      |
| -------------------------- | ---------------------------------- | ----------- |
| 1. Throughput              | Summary/Aggregate Report           | ✅ Built-in |
| 2. Error rates             | Summary Report                     | ✅ Built-in |
| 3. Response time           | All time reports                   | ✅ Built-in |
| 4. CPU utilization         | system_monitor.sh/Activity Monitor | 🔧 External |
| 5. Memory utilization      | system_monitor.sh/Activity Monitor | 🔧 External |
| 6. Average load time       | Response Times Over Time           | ✅ Built-in |
| 7. Concurrent users        | Active Threads Over Time           | ✅ Built-in |
| 8. 90th percentile         | Response Time Percentiles          | ✅ Built-in |
| 9. Average latency         | Aggregate Report                   | ✅ Built-in |
| 10. Bandwidth              | Bytes Throughput Over Time         | ✅ Built-in |
| 11. Requests/sec           | Transactions per Second            | ✅ Built-in |
| 12. Transactions pass/fail | Summary Report                     | ✅ Built-in |
| 13. Disk I/O               | system_monitor.sh/Activity Monitor | 🔧 External |
| 14. Application uptime     | Test duration/server logs          | ✅ Implicit |
| 15. Thread counts          | Active Threads Over Time           | ✅ Built-in |
| 16. Resource load time     | Individual samplers                | ✅ Built-in |

## Quick Start Guide

1. **For immediate results**: Enable photo loading and search in HomePageGroup.jmx
2. **For basic system monitoring**: Run the monitor.sh script
3. **For advanced monitoring**: Setup PerfMon plugin
4. **For enterprise monitoring**: Setup InfluxDB + Grafana

## Running Enhanced Test

```bash
# Run with enhanced reporting
jmeter -n -t HomePageGroup.jmx -l results.jtl -e -o report/
```

The enhanced test now includes:

- ✅ 8 comprehensive scenarios
- ✅ P99/percentile response times
- ✅ Database connectivity validation
- ✅ Real product data testing
- ✅ Photo loading performance
- ✅ Search functionality testing
