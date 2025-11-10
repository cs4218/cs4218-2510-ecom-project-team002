#!/bin/bash

# Comprehensive JMeter Load Test Runner with System Monitoring
# This script orchestrates the entire load testing process

# Configuration
JMETER_HOME="/opt/homebrew/bin"  # Adjust this to your JMeter installation path
TEST_PLAN="PaymentPageGroup.jmx"
RESULTS_DIR="./load-test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Test configuration
TEST_DURATION=600  # 10 minutes
RAMP_UP_TIME=180   # 3 minutes
NUM_THREADS=15     # Concurrent users

# Create results directory
mkdir -p "$RESULTS_DIR"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if required tools are available
check_dependencies() {
    log_message "🔍 Checking dependencies..."
    
    # Check if JMeter is available
    if ! command -v jmeter >/dev/null 2>&1; then
        log_message "❌ JMeter not found in PATH. Please install JMeter or update JMETER_HOME"
        log_message "   You can install with: brew install jmeter"
        exit 1
    fi
    
    # Check if Node.js server is running
    if ! lsof -i :6060 >/dev/null 2>&1; then
        log_message "⚠️  Warning: No service detected on port 6060. Make sure your e-commerce server is running."
        log_message "   Start with: npm start or node server.js"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_message "✅ E-commerce server detected on port 6060"
    fi
    
    log_message "✅ All dependencies checked"
}

# Function to start system monitoring
start_monitoring() {
    log_message "📊 Starting system monitoring..."
    ./system-monitor.sh &
    MONITOR_PID=$!
    echo $MONITOR_PID > "$RESULTS_DIR/monitor.pid"
    log_message "✅ System monitoring started (PID: $MONITOR_PID)"
}

# Function to stop system monitoring
stop_monitoring() {
    if [ -f "$RESULTS_DIR/monitor.pid" ]; then
        MONITOR_PID=$(cat "$RESULTS_DIR/monitor.pid")
        log_message "🛑 Stopping system monitoring (PID: $MONITOR_PID)..."
        kill $MONITOR_PID 2>/dev/null || true
        rm -f "$RESULTS_DIR/monitor.pid"
        log_message "✅ System monitoring stopped"
    fi
}

# Function to run JMeter test
run_jmeter_test() {
    log_message "🚀 Starting JMeter load test..."
    log_message "📋 Test Plan: $TEST_PLAN"
    log_message "👥 Concurrent Users: $NUM_THREADS"
    log_message "⏱️  Ramp-up Time: $RAMP_UP_TIME seconds"
    log_message "🕐 Test Duration: $TEST_DURATION seconds"
    
    # JMeter command with comprehensive reporting
    JMETER_RESULTS="$RESULTS_DIR/jmeter_results_$TIMESTAMP.jtl"
    JMETER_LOG="$RESULTS_DIR/jmeter_log_$TIMESTAMP.log"
    JMETER_REPORT_DIR="$RESULTS_DIR/html_report_$TIMESTAMP"
    
    jmeter -n -t "$TEST_PLAN" \
           -l "$JMETER_RESULTS" \
           -j "$JMETER_LOG" \
           -e -o "$JMETER_REPORT_DIR" \
           -Jthreads=$NUM_THREADS \
           -Jrampup=$RAMP_UP_TIME \
           -Jduration=$TEST_DURATION \
           -Jiterations=2
    
    JMETER_EXIT_CODE=$?
    
    if [ $JMETER_EXIT_CODE -eq 0 ]; then
        log_message "✅ JMeter test completed successfully"
        log_message "📊 Results saved to: $JMETER_RESULTS"
        log_message "📈 HTML Report: $JMETER_REPORT_DIR/index.html"
    else
        log_message "❌ JMeter test failed with exit code: $JMETER_EXIT_CODE"
    fi
    
    return $JMETER_EXIT_CODE
}

# Function to generate comprehensive report
generate_report() {
    log_message "📋 Generating comprehensive test report..."
    
    REPORT_FILE="$RESULTS_DIR/load_test_report_$TIMESTAMP.md"
    
    cat > "$REPORT_FILE" << EOF
# Load Test Report - $(date '+%Y-%m-%d %H:%M:%S')

## Test Configuration
- **Test Plan**: $TEST_PLAN  
- **Concurrent Users**: $NUM_THREADS
- **Ramp-up Time**: $RAMP_UP_TIME seconds
- **Test Duration**: $TEST_DURATION seconds
- **Target Application**: http://localhost:6060

## System Information
- **OS**: $(uname -s) $(uname -r)
- **CPU**: $(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo "Unknown")
- **Memory**: $(system_profiler SPHardwareDataType | grep "Memory:" | awk '{print $2 " " $3}' 2>/dev/null || echo "Unknown")
- **Test Date**: $(date '+%Y-%m-%d %H:%M:%S')

## Performance Results

### JMeter Results Summary
EOF

    # Extract JMeter statistics if results file exists
    if [ -f "$RESULTS_DIR/jmeter_results_$TIMESTAMP.jtl" ]; then
        echo "
\`\`\`
$(tail -n +2 "$RESULTS_DIR/jmeter_results_$TIMESTAMP.jtl" | wc -l | xargs echo "Total Samples:")
$(grep ",true," "$RESULTS_DIR/jmeter_results_$TIMESTAMP.jtl" | wc -l | xargs echo "Successful:")
$(grep ",false," "$RESULTS_DIR/jmeter_results_$TIMESTAMP.jtl" | wc -l | xargs echo "Failed:")
\`\`\`
" >> "$REPORT_FILE"
    fi

    echo "
### System Monitoring Results

Detailed system metrics are available in CSV format:
- **System Metrics**: monitoring-results/system_metrics_*.csv
- **JMeter Results**: $RESULTS_DIR/jmeter_results_$TIMESTAMP.jtl
- **JMeter HTML Report**: $RESULTS_DIR/html_report_$TIMESTAMP/index.html

## Files Generated
- JMeter Results: \`$RESULTS_DIR/jmeter_results_$TIMESTAMP.jtl\`
- JMeter Log: \`$RESULTS_DIR/jmeter_log_$TIMESTAMP.log\`
- HTML Report: \`$RESULTS_DIR/html_report_$TIMESTAMP/index.html\`
- System Metrics: \`monitoring-results/system_metrics_*.csv\`
- This Report: \`$REPORT_FILE\`

## Next Steps
1. Open the HTML report in your browser: \`open $RESULTS_DIR/html_report_$TIMESTAMP/index.html\`
2. Analyze system metrics in the CSV file
3. Compare results with previous test runs
4. Identify performance bottlenecks and optimization opportunities
" >> "$REPORT_FILE"
    
    log_message "📋 Report generated: $REPORT_FILE"
}

# Function to cleanup on exit
cleanup() {
    log_message "🧹 Cleaning up..."
    stop_monitoring
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution flow
main() {
    log_message "🚀 Starting comprehensive load test with system monitoring"
    log_message "=================================================="
    
    # Check dependencies
    check_dependencies
    
    # Start monitoring
    start_monitoring
    
    # Wait a moment for monitoring to initialize
    sleep 3
    
    # Run the test
    run_jmeter_test
    RESULT_CODE=$?
    
    # Wait a moment for final metrics
    sleep 5
    
    # Stop monitoring
    stop_monitoring
    
    # Generate report
    generate_report
    
    log_message "=================================================="
    if [ $RESULT_CODE -eq 0 ]; then
        log_message "✅ Load test completed successfully!"
        log_message "📊 Open HTML report: open $RESULTS_DIR/html_report_$TIMESTAMP/index.html"
    else
        log_message "❌ Load test completed with errors"
    fi
    
    return $RESULT_CODE
}

# Run main function
main "$@"