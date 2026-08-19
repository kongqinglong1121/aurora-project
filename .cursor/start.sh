#!/usr/bin/env bash
#
# Cloud Agent start phase for the Aurora Framework demo.
#
# Per-boot reconciliation: ensures MariaDB is up, (re)builds the deployable
# AuroraDemo webapp with runtime-correct config, and starts Tomcat. Returns
# once both services are reachable. Safe to run repeatedly.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JAVA8="/usr/lib/jvm/java-8-openjdk-amd64"
TOMCAT_HOME="/opt/tomcat9"
OVERLAY_JAR="/opt/aurora/aa-aurora-src.jar"
DEPLOY="${TOMCAT_HOME}/webapps/aurora"

log() { echo "[start] $*"; }

# ---------------------------------------------------------------------------
# 1. MariaDB
# ---------------------------------------------------------------------------
sudo mkdir -p /var/run/mysqld
sudo chown mysql:mysql /var/run/mysqld
if ! sudo mariadb-admin ping >/dev/null 2>&1; then
  log "Starting MariaDB..."
  sudo bash -c 'nohup mariadbd-safe --datadir=/var/lib/mysql >/var/log/mariadbd-safe.log 2>&1 &'
  for _ in $(seq 1 30); do sudo mariadb-admin ping >/dev/null 2>&1 && break; sleep 1; done
fi
sudo mariadb-admin ping >/dev/null 2>&1 && log "MariaDB is up."

# ---------------------------------------------------------------------------
# 2. Assemble the deployable webapp (repo copy + fresh core + runtime config)
# ---------------------------------------------------------------------------
log "Assembling AuroraDemo deployment at ${DEPLOY}..."
rm -rf "${DEPLOY}"
cp -r "${REPO_ROOT}/AuroraDemo/web" "${DEPLOY}"
mkdir -p "${DEPLOY}/logs"
[ -f "${OVERLAY_JAR}" ] && cp "${OVERLAY_JAR}" "${DEPLOY}/WEB-INF/lib/aa-aurora-src.jar"

# Point the datasource at the local MariaDB instance.
cat > "${DEPLOY}/WEB-INF/aurora.database/datasource.config" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<dc:data-source-config xmlns:dc="aurora.datasource" useTransactionManager="false">
	<dc:database-connections>
		<dc:database-connection driverClass="com.mysql.jdbc.Driver"
			url="jdbc:mysql://127.0.0.1:3306/aurora?useUnicode=true&amp;characterEncoding=UTF-8&amp;useSSL=false" userName="aurora"
			password="aurora" pool="false">
			<dc:properties> minPoolSize=10 maxPoolSize=50
				testConnectionOnCheckin=true checkoutTimeout=3000
				idleConnectionTestPeriod=60 maxIdleTime=120
				preferredTestQuery=select 1 </dc:properties>
		</dc:database-connection>
	</dc:database-connections>
</dc:data-source-config>
EOF

# Point the engine at runtime-correct log + UI template paths.
cat > "${DEPLOY}/WEB-INF/uncertain.local.xml" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<uncertain-engine defaultLogLevel="INFO">
    <path-config logPath="${DEPLOY}/logs"
        uiPackageBasePath="${REPO_ROOT}/AuroraUI/src"/>
</uncertain-engine>
EOF

# ---------------------------------------------------------------------------
# 3. Tomcat
# ---------------------------------------------------------------------------
export JAVA_HOME="${JAVA8}"
if curl -s -o /dev/null "http://127.0.0.1:8080/" 2>/dev/null; then
  log "Tomcat already running; restarting to pick up fresh deployment..."
  "${TOMCAT_HOME}/bin/catalina.sh" stop 10 -force >/dev/null 2>&1 || true
  sleep 2
fi
log "Starting Tomcat..."
"${TOMCAT_HOME}/bin/catalina.sh" start

for _ in $(seq 1 30); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:8080/aurora/login.screen" || true)"
  [ "${code}" = "200" ] && break
  sleep 1
done
log "AuroraDemo available at http://localhost:8080/aurora/login.screen (login ADMIN / 1). Last status: ${code:-n/a}"
