#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/apps/pethaven}"
ENV_FILE="${ENV_FILE:-$APP_DIR/app.env}"
JAR_NAME="${JAR_NAME:-$APP_DIR/pethaven.jar}"
JAR_PATTERN="${JAR_PATTERN:-$APP_DIR/pethaven-backend*.jar}"
PID_FILE="${PID_FILE:-$APP_DIR/app.pid}"
LOG_FILE="${LOG_FILE:-$APP_DIR/app.log}"
JAVA_OPTS="${JAVA_OPTS:--Xms256m -Xmx512m}"

cd "$APP_DIR"

if [ -f "$ENV_FILE" ]; then
  set -a
  . "$ENV_FILE"
  set +a
fi

resolve_jar() {
  if [ -f "$JAR_NAME" ]; then
    echo "$JAR_NAME"
    return
  fi

  local latest
  latest=$(ls -t $JAR_PATTERN 2>/dev/null | head -n 1 || true)
  if [ -z "$latest" ]; then
    echo "JAR not found in $APP_DIR" >&2
    exit 1
  fi
  echo "$latest"
}

is_running() {
  if [ -f "$PID_FILE" ]; then
    local pid
    pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
  fi
  return 1
}

start() {
  if is_running; then
    echo "Service already running (pid $(cat "$PID_FILE"))"
    return 0
  fi

  local jar
  jar=$(resolve_jar)
  echo "Starting $jar ..."
  nohup java $JAVA_OPTS -jar "$jar" --server.port="${SERVER_PORT:-8080}" >> "$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"
  echo "Started (pid $(cat "$PID_FILE"))"
}

stop() {
  if is_running; then
    echo "Stopping service (pid $(cat "$PID_FILE"))"
    kill "$(cat "$PID_FILE")"
    rm -f "$PID_FILE"
  else
    echo "Service is not running"
  fi
}

restart() {
  stop
  sleep 2
  start
}

status() {
  if is_running; then
    echo "Running (pid $(cat "$PID_FILE"))"
  else
    echo "Stopped"
  fi
}

logs() {
  touch "$LOG_FILE"
  tail -f "$LOG_FILE"
}

case "${1:-status}" in
  start|stop|restart|status|logs)
    "$1"
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|logs}" >&2
    exit 1
    ;;
esac
