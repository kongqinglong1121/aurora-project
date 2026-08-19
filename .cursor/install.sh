#!/usr/bin/env bash
#
# Cloud Agent install phase for the Aurora Framework demo.
#
# Prepares durable, source-derived state so the AuroraDemo web application can
# run end to end:
#   1. System toolchain (JDK 8, Ant, MariaDB, unzip).
#   2. Apache Tomcat 9 (javax.servlet namespace, matches the servlet 2.3 app).
#   3. A framework build compiled from /aurora + /uncertain source. The bundled
#      demo jars predate AuroraUI/src and are missing ~90 aurora.ui.std server
#      components, so we recompile the core into an overlay jar.
#   4. The MySQL `aurora` schema + demo seed data loaded into MariaDB.
#
# The script is idempotent: it may be run repeatedly against cached state.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JAVA8="/usr/lib/jvm/java-8-openjdk-amd64"
TOMCAT_HOME="/opt/tomcat9"
TOMCAT_VERSION="9.0.121"
BUILD_OUT="/opt/aurora"
OVERLAY_JAR="${BUILD_OUT}/aa-aurora-src.jar"

log() { echo "[install] $*"; }

# ---------------------------------------------------------------------------
# 1. System packages
# ---------------------------------------------------------------------------
log "Installing system packages (JDK 8, Ant, MariaDB, tooling)..."
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -y
sudo apt-get install -y --no-install-recommends \
  openjdk-8-jdk ant mariadb-server mariadb-client curl unzip ca-certificates

# ---------------------------------------------------------------------------
# 2. Apache Tomcat 9
# ---------------------------------------------------------------------------
if [ ! -x "${TOMCAT_HOME}/bin/catalina.sh" ]; then
  log "Downloading Apache Tomcat ${TOMCAT_VERSION}..."
  tmp="$(mktemp -d)"
  url="https://dlcdn.apache.org/tomcat/tomcat-9/v${TOMCAT_VERSION}/bin/apache-tomcat-${TOMCAT_VERSION}.tar.gz"
  arch_url="https://archive.apache.org/dist/tomcat/tomcat-9/v${TOMCAT_VERSION}/bin/apache-tomcat-${TOMCAT_VERSION}.tar.gz"
  curl -fsSL -o "${tmp}/tomcat.tar.gz" "${url}" || curl -fsSL -o "${tmp}/tomcat.tar.gz" "${arch_url}"
  sudo tar xzf "${tmp}/tomcat.tar.gz" -C /opt
  sudo mv "/opt/apache-tomcat-${TOMCAT_VERSION}" "${TOMCAT_HOME}"
  sudo chown -R "$(id -un):$(id -gn)" "${TOMCAT_HOME}"
  rm -rf "${tmp}"
else
  log "Tomcat already present at ${TOMCAT_HOME}."
fi

# Run Tomcat under Java 8 (legacy dependencies predate Java 11+).
cat > "${TOMCAT_HOME}/bin/setenv.sh" <<EOF
export JAVA_HOME=${JAVA8}
export CATALINA_OPTS="\${CATALINA_OPTS:-} -Dfile.encoding=UTF-8"
EOF
chmod +x "${TOMCAT_HOME}/bin/setenv.sh"

# ---------------------------------------------------------------------------
# 3. Compile the framework from source into an overlay jar
# ---------------------------------------------------------------------------
log "Compiling uncertain + aurora from source with JDK 8..."
BUILD_TMP="$(mktemp -d)"
SRC_UTF8="${BUILD_TMP}/src-utf8"
CLASSES="${BUILD_TMP}/classes"
mkdir -p "${SRC_UTF8}" "${CLASSES}"

# Sources are a mix of GBK and UTF-8 (legacy Chinese comments). Normalise each
# file to UTF-8 so a single -encoding flag compiles cleanly.
find "${REPO_ROOT}/uncertain" "${REPO_ROOT}/aurora/aurora" -name '*.java' > "${BUILD_TMP}/src.txt"
while IFS= read -r f; do
  dest="${SRC_UTF8}${f}"
  mkdir -p "$(dirname "${dest}")"
  if iconv -f UTF-8 -t UTF-8 "${f}" >/dev/null 2>&1; then
    cp "${f}" "${dest}"
  else
    iconv -f GBK -t UTF-8 "${f}" > "${dest}" 2>/dev/null || cp "${f}" "${dest}"
  fi
done < "${BUILD_TMP}/src.txt"

# Exclude features that require APIs unavailable in this runtime (SOAP web
# services / JDK-internal SAAJ, and Servlet 3.0 async endpoints). None are used
# by AuroraDemo's web.xml.
find "${SRC_UTF8}" -name '*.java' \
  | grep -vE '/aurora/service/http/async/|/aurora/service/ws/|/aurora/service/http/WSDLServlet\.java' \
  > "${BUILD_TMP}/src-runtime.txt"

CP="$(find "${REPO_ROOT}/AuroraDemo/web/WEB-INF/lib" \
        "${REPO_ROOT}/AuroraDependency/Library" \
        "${REPO_ROOT}/aurora-plugin/dependency" -name '*.jar' 2>/dev/null \
      | grep -viE '/(aurora|aurora-plugin|aurora-js)\.jar$' | tr '\n' ':')"
CP="${CP}${TOMCAT_HOME}/lib/servlet-api.jar"

"${JAVA8}/bin/javac" -encoding UTF-8 -nowarn -proc:none -XDignore.symbol.file \
  -cp "${CP}" -d "${CLASSES}" @"${BUILD_TMP}/src-runtime.txt"

sudo mkdir -p "${BUILD_OUT}"
sudo chown -R "$(id -un):$(id -gn)" "${BUILD_OUT}"
( cd "${CLASSES}" && "${JAVA8}/bin/jar" cf "${OVERLAY_JAR}" . )
log "Built overlay jar: ${OVERLAY_JAR} ($(du -h "${OVERLAY_JAR}" | cut -f1))"
rm -rf "${BUILD_TMP}"

# ---------------------------------------------------------------------------
# 4. Initialise MariaDB and load the demo schema
# ---------------------------------------------------------------------------
log "Preparing MariaDB data directory..."
sudo mkdir -p /var/run/mysqld
sudo chown mysql:mysql /var/run/mysqld
if [ ! -d /var/lib/mysql/mysql ]; then
  sudo mariadb-install-db --user=mysql --datadir=/var/lib/mysql >/dev/null
fi

# Start a temporary server just long enough to create the user + load schema.
if ! sudo mariadb-admin ping >/dev/null 2>&1; then
  sudo bash -c 'nohup mariadbd-safe --datadir=/var/lib/mysql >/var/log/mariadbd-safe.log 2>&1 &'
  for _ in $(seq 1 30); do sudo mariadb-admin ping >/dev/null 2>&1 && break; sleep 1; done
fi

log "Creating aurora database user..."
sudo mariadb <<'SQL'
CREATE USER IF NOT EXISTS 'aurora'@'localhost' IDENTIFIED BY 'aurora';
CREATE USER IF NOT EXISTS 'aurora'@'127.0.0.1' IDENTIFIED BY 'aurora';
GRANT ALL PRIVILEGES ON *.* TO 'aurora'@'localhost' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'aurora'@'127.0.0.1' WITH GRANT OPTION;
FLUSH PRIVILEGES;
SQL

log "Loading AuroraDemo schema + seed data..."
# The dump defines a stored function/procedure whose bodies contain ';' without
# DELIMITER statements; wrap them so the client does not split mid-routine.
awk '
{ line=$0; sub(/\r$/,"",line) }
line ~ /^CREATE DEFINER.*(FUNCTION|PROCEDURE)/ { print "DELIMITER $$"; print line; inr=1; next }
inr==1 {
  if (line=="END;" || line=="end;") { sub(/;$/,"$$",line); print line; print "DELIMITER ;"; inr=0; next }
  print line; next
}
{ print line }
' "${REPO_ROOT}/AuroraDemo/database/aurora.sql" > "${BUILD_OUT}/aurora_schema.sql"
sudo mariadb < "${BUILD_OUT}/aurora_schema.sql"

log "Install complete."
