#!/bin/bash
# OWASP ZAP API Scan Command
# Ensure Docker is running to execute this containerized scan

TARGET_URL=${1:-"http://localhost:5000"}

echo "Starting OWASP ZAP Baseline Scan against $TARGET_URL"

# Run ZAP baseline scan against the backend API
docker run -v $(pwd):/zap/wrk/:rw -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
    -t $TARGET_URL \
    -r zap-report.html \
    -I 

echo "Scan complete. Check zap-report.html for the Risk Matrix and Vulnerabilities."
