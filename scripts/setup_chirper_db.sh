#!/usr/bin/env bash
set -euo pipefail

SCHEMA_URL="${SCHEMA_URL:-https://raw.githubusercontent.com/anyabdch/CS196-Database/main/chirper_full_schema.sql}"
MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_ADMIN_USER="${MYSQL_ADMIN_USER:-root}"
MYSQL_ADMIN_PASSWORD="${MYSQL_ADMIN_PASSWORD:-}"
CHIRPER_DB="${CHIRPER_DB:-chirper}"
CHIRPER_TEST_DB="${CHIRPER_TEST_DB:-chirper_test}"

mysql_cmd=(mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_ADMIN_USER")
if [[ -n "$MYSQL_ADMIN_PASSWORD" ]]; then
  mysql_cmd+=("-p$MYSQL_ADMIN_PASSWORD")
fi

echo "Downloading schema from: $SCHEMA_URL"
tmp_sql="$(mktemp)"
cleanup() {
  rm -f "$tmp_sql"
}
trap cleanup EXIT

curl -fsSL "$SCHEMA_URL" -o "$tmp_sql"

echo "Creating databases: $CHIRPER_DB, $CHIRPER_TEST_DB"
"${mysql_cmd[@]}" -e "CREATE DATABASE IF NOT EXISTS \`$CHIRPER_DB\`;"
"${mysql_cmd[@]}" -e "CREATE DATABASE IF NOT EXISTS \`$CHIRPER_TEST_DB\`;"

echo "Importing schema into $CHIRPER_DB"
"${mysql_cmd[@]}" "$CHIRPER_DB" < "$tmp_sql"

echo "Importing schema into $CHIRPER_TEST_DB"
"${mysql_cmd[@]}" "$CHIRPER_TEST_DB" < "$tmp_sql"

echo "Done."
echo "Set env vars for app runtime:"
echo "  DB_HOST=$MYSQL_HOST"
echo "  DB_PORT=$MYSQL_PORT"
echo "  DB_USER=<app_user>"
echo "  DB_PASSWORD=<app_password>"
echo "  DB_NAME=$CHIRPER_DB"
echo
echo "Set env vars for DB tests:"
echo "  TEST_DB_HOST=$MYSQL_HOST"
echo "  TEST_DB_PORT=$MYSQL_PORT"
echo "  TEST_DB_USER=<app_user>"
echo "  TEST_DB_PASSWORD=<app_password>"
echo "  TEST_DB_NAME=$CHIRPER_TEST_DB"
