#!/bin/bash

# System Monitoring Script for JMeter Load Testing
# This script captures system metrics during load testing

# Configuration
MONITOR_INTERVAL=5  # seconds between measurements
RESULTS_DIR="./monitoring-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$RESULTS_DIR/system_metrics_$TIMESTAMP.log"
CSV_FILE="$RESULTS_DIR/system_metrics_$TIMESTAMP.csv"

# Create results directory
mkdir -p "$RESULTS_DIR"

# Function to log with timestamp
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to get process info for Node.js and MongoDB
get_process_metrics() {
    # Node.js process metrics
    NODE_PID=$(pgrep -f "node.*server.js\|npm.*start" | head -1)
    if [ ! -z "$NODE_PID" ]; then
        NODE_CPU=$(ps -p $NODE_PID -o %cpu= | xargs)
        NODE_MEM=$(ps -p $NODE_PID -o %mem= | xargs)
        NODE_RSS=$(ps -p $NODE_PID -o rss= | xargs)
    else
        NODE_CPU=0
        NODE_MEM=0
        NODE_RSS=0
    fi
    
    # MongoDB process metrics (if running locally)
    MONGO_PID=$(pgrep mongod | head -1)
    if [ ! -z "$MONGO_PID" ]; then
        MONGO_CPU=$(ps -p $MONGO_PID -o %cpu= | xargs)
        MONGO_MEM=$(ps -p $MONGO_PID -o %mem= | xargs)
        MONGO_RSS=$(ps -p $MONGO_PID -o rss= | xargs)
    else
        MONGO_CPU=0
        MONGO_MEM=0
        MONGO_RSS=0
    fi
    
    echo "$NODE_CPU,$NODE_MEM,$NODE_RSS,$MONGO_CPU,$MONGO_MEM,$MONGO_RSS"
}

# Function to get network metrics
get_network_metrics() {
    # Get network interface stats (en0 is common on macOS)
    INTERFACE="en0"
    if netstat -I $INTERFACE 1 1 >/dev/null 2>&1; then
        NET_STATS=$(netstat -I $INTERFACE -b | tail -1)
        RX_BYTES=$(echo $NET_STATS | awk '{print $7}')
        TX_BYTES=$(echo $NET_STATS | awk '{print $10}')
    else
        RX_BYTES=0
        TX_BYTES=0
    fi
    echo "$RX_BYTES,$TX_BYTES"
}

# Function to get disk I/O metrics
get_disk_metrics() {
    # Use iostat if available, otherwise use basic df
    if command -v iostat >/dev/null 2>&1; then
        DISK_STATS=$(iostat -d 1 1 | tail -1 2>/dev/null || echo "0 0 0")
        READ_OPS=$(echo $DISK_STATS | awk '{print $1}' | head -c 10)
        WRITE_OPS=$(echo $DISK_STATS | awk '{print $2}' | head -c 10)
    else
        READ_OPS=0
        WRITE_OPS=0
    fi
    
    # Disk usage
    DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
    
    echo "$READ_OPS,$WRITE_OPS,$DISK_USAGE"
}

# Initialize CSV file with headers
echo "Timestamp,CPU_Total,Memory_Used_Percent,Memory_Available_GB,Load_1m,Load_5m,Load_15m,Node_CPU,Node_Mem,Node_RSS_KB,Mongo_CPU,Mongo_Mem,Mongo_RSS_KB,RX_Bytes,TX_Bytes,Disk_Read_Ops,Disk_Write_Ops,Disk_Usage_Percent,Active_Connections,JMeter_Status" > "$CSV_FILE"

log_message "🚀 Starting system monitoring for JMeter load test"
log_message "📊 Monitoring interval: ${MONITOR_INTERVAL} seconds"
log_message "📁 Results will be saved to: $CSV_FILE"
log_message "🔍 Monitoring Node.js PID: ${NODE_PID:-'Not found'}"
log_message "🔍 Monitoring MongoDB PID: ${MONGO_PID:-'Not found'}"

# Check if JMeter is running
check_jmeter_status() {
    if pgrep -f "jmeter\|ApacheJMeter" >/dev/null; then
        echo "RUNNING"
    else
        echo "STOPPED"
    fi
}

log_message "⏳ Waiting for JMeter to start... (monitoring will begin automatically)"

# Main monitoring loop
while true; do
    # Get timestamp
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Get system metrics
    CPU_TOTAL=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
    
    # Memory metrics (macOS specific)
    MEMORY_PRESSURE=$(memory_pressure | grep "System-wide memory free percentage" | awk '{print $5}' | sed 's/%//')
    MEMORY_USED_PERCENT=$((100 - ${MEMORY_PRESSURE:-50}))
    
    # Available memory in GB
    MEMORY_AVAILABLE=$(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
    MEMORY_AVAILABLE_GB=$(echo "scale=2; $MEMORY_AVAILABLE * 4096 / 1024 / 1024 / 1024" | bc -l 2>/dev/null || echo "0")
    
    # Load averages
    LOAD_STATS=$(uptime | awk -F'load averages: ' '{print $2}')
    LOAD_1M=$(echo $LOAD_STATS | awk '{print $1}')
    LOAD_5M=$(echo $LOAD_STATS | awk '{print $2}')
    LOAD_15M=$(echo $LOAD_STATS | awk '{print $3}')
    
    # Process metrics
    PROCESS_METRICS=$(get_process_metrics)
    
    # Network metrics
    NETWORK_METRICS=$(get_network_metrics)
    
    # Disk metrics
    DISK_METRICS=$(get_disk_metrics)
    
    # Active network connections to your app (port 6060)
    ACTIVE_CONNECTIONS=$(lsof -i :6060 2>/dev/null | grep ESTABLISHED | wc -l | xargs)
    
    # JMeter status
    JMETER_STATUS=$(check_jmeter_status)
    
    # Combine all metrics
    METRICS_ROW="$TIMESTAMP,$CPU_TOTAL,$MEMORY_USED_PERCENT,$MEMORY_AVAILABLE_GB,$LOAD_1M,$LOAD_5M,$LOAD_15M,$PROCESS_METRICS,$NETWORK_METRICS,$DISK_METRICS,$ACTIVE_CONNECTIONS,$JMETER_STATUS"
    
    # Write to CSV
    echo "$METRICS_ROW" >> "$CSV_FILE"
    
    # Log summary (only when JMeter is running to reduce noise)
    if [ "$JMETER_STATUS" = "RUNNING" ]; then
        log_message "📈 CPU: ${CPU_TOTAL}% | Memory: ${MEMORY_USED_PERCENT}% | Load: $LOAD_1M | Connections: $ACTIVE_CONNECTIONS | JMeter: $JMETER_STATUS"
    fi
    
    sleep $MONITOR_INTERVAL
done