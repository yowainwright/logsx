#!/bin/bash

# Generate JSON logs and pipe them to logsDX
while true; do
  # Generate logs with different statuses to test colors
  for status in "success" "error" "pending"; do
    echo "{
      \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")\",
      \"level\": \"info\",
      \"service\": \"api\",
      \"action\": \"request\",
      \"status\": \"$status\",
      \"user\": \"user123\",
      \"duration\": 123,
      \"requestId\": \"req-123\",
      \"correlationId\": \"corr-456\",
      \"environment\": \"development\",
      \"version\": \"1.0.0\",
      \"message\": \"Processing user request with status: $status\"
    }" | tr -d '\n' | FORCE_COLOR=3 NO_COLOR= bun run src/cli/index.ts --parser json --debug
    sleep 1
  done
done 