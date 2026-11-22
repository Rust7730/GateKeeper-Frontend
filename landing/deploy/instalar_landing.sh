#!/bin/bash
# Instalador de la Landing aislada de Gatekeeper en una instancia EC2 micro (Ubuntu 24.04).
#
# Qué hace:
# 1. Instala Nginx nativo (~15 MiB de RAM), Certbot, Git y rsync.
# 2. Crea /opt/gatekeeper-landing/actualizar_landing.sh + timer de systemd cada 5 minutos
#    que descarga automáticamente la rama `dist-landing` de GateKeeper-Frontend.
# 3. Configura Nginx endurecido (server_tokens off, CSP, X-Frame-Options, nosniff, caché inmutable
#    en /_astro/*) y si se pasa un dominio (p. ej. <IP-CON-GUIONES>.sslip.io), emite certificado
#    TLS con Let's Encrypt automáticamente.
#
# Uso en la instancia micro:
#   sudo bash instalar_landing.sh <IP-CON-GUIONES>.sslip.io
set -euo pipefail
umask 022

if [[ $EUID -ne 0 ]]; then
    echo "Ejecuta este script con sudo: sudo bash $0 <dominio.sslip.io>" >&2
    exit 1
fi

readonly DOMINIO="${1:-_}"
readonly OPT="/opt/gatekeeper-landing"
readonly WEB="/var/www/gatekeeper-landing"
readonly ESTADO="/var/lib/gatekeeper-landing"
readonly LOG="/var/log/gatekeeper-landing.log"

echo "==> [1/4] Instalando paquetes base (nginx, certbot, git, rsync)..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq nginx certbot python3-certbot-nginx git rsync curl ca-certificates

install -d -o root -g root -m 0755 "$OPT" "$WEB"
install -d -o root -g root -m 0700 "$ESTADO"

echo "==> [2/4] Creando actualizador automático por pull ($OPT/actualizar_landing.sh)..."
cat >"$OPT/actualizar_landing.sh" <<'EOF'
#!/bin/bash
set -euo pipefail
umask 022

readonly REPO="https://github.com/Rust7730/GateKeeper-Frontend.git"
readonly RAMA="dist-landing"
readonly WEB="/var/www/gatekeeper-landing"
readonly ESTADO="/var/lib/gatekeeper-landing"
readonly REVISION="$ESTADO/landing.revision"
readonly LOG="/var/log/gatekeeper-landing.log"

registrar() {
    local linea
    linea="$(date -u +%Y-%m-%dT%H:%M:%SZ) [landing] $*"
    echo "$linea"
    echo "$linea" >>"$LOG"
}

remoto=$(git ls-remote --heads "$REPO" "refs/heads/$RAMA" 2>/dev/null | awk '{print $1}' | head -n 1 || true)
if [[ ! $remoto =~ ^[0-9a-f]{40}$ ]]; then
    exit 0
fi

actual=$(cat "$REVISION" 2>/dev/null || true)
if [[ $remoto == "$actual" && -f "$WEB/index.html" ]]; then
    exit 0
fi

temporal=$(mktemp -d "$ESTADO/.landing.XXXXXX")
trap 'rm -rf "$temporal"' EXIT

if ! git clone --quiet --depth 1 --branch "$RAMA" "$REPO" "$temporal/repo" 2>/dev/null; then
    registrar "no se pudo descargar $RAMA"
    exit 1
fi

rm -rf "$temporal/repo/.git"
if [[ ! -f "$temporal/repo/index.html" ]]; then
    registrar "RECHAZADO: $remoto no contiene index.html"
    exit 1
fi
if [[ -n $(find "$temporal/repo" -type l -print -quit) ]]; then
    registrar "RECHAZADO: $remoto contiene enlaces simbólicos"
    exit 1
fi

chown -R root:root "$temporal/repo"
chmod -R u=rwX,go=rX "$temporal/repo"
rsync -a --delete --no-links "$temporal/repo"/ "$WEB"/

printf '%s\n' "$remoto" >"$REVISION"
chmod 0600 "$REVISION"
registrar "actualizado ${actual:-ninguno} -> $remoto"
EOF
chmod 0755 "$OPT/actualizar_landing.sh"

"$OPT/actualizar_landing.sh" || true

echo "==> [3/4] Configurando Nginx endurecido para la Landing..."
sed -i 's/# server_tokens off;/server_tokens off;/' /etc/nginx/nginx.conf
rm -f /etc/nginx/sites-enabled/default

cat >/etc/nginx/sites-available/gatekeeper-landing.conf <<EOF
server {
    listen 80 default_server;
    server_name ${DOMINIO};

    root ${WEB};
    index index.html;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "no-referrer" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" always;

    location /_astro/ {
        add_header X-Content-Type-Options "nosniff" always;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ =404;
    }
}
EOF

ln -sf /etc/nginx/sites-available/gatekeeper-landing.conf /etc/nginx/sites-enabled/gatekeeper-landing.conf
nginx -t
systemctl enable --now nginx
systemctl reload nginx

if [[ $DOMINIO != "_" ]]; then
    echo "==> Emitiendo certificado TLS con Let's Encrypt para $DOMINIO..."
    certbot --nginx -d "$DOMINIO" --non-interactive --agree-tos --register-unsafely-without-email --redirect ||
        echo "AVISO: Certbot no pudo emitir el certificado aún (verifica que el puerto 80 esté abierto en el Security Group)."
fi

echo "==> [4/4] Configurando timer de actualización automática cada 5 minutos..."
cat >/etc/systemd/system/gatekeeper-landing-actualizar.service <<EOF
[Unit]
Description=Gatekeeper Landing: actualiza estáticos desde dist-landing
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=${OPT}/actualizar_landing.sh
NoNewPrivileges=yes
PrivateTmp=yes
ProtectHome=yes
ProtectSystem=full
ReadWritePaths=${WEB} ${ESTADO} ${LOG}
EOF

cat >/etc/systemd/system/gatekeeper-landing-actualizar.timer <<'EOF'
[Unit]
Description=Gatekeeper Landing: busca cambios en dist-landing cada 5 minutos

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
RandomizedDelaySec=20s
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now gatekeeper-landing-actualizar.timer

echo ""
echo "=================================================================="
echo " Landing desplegada en: http://${DOMINIO}/ (y https:// si TLS pasó)"
echo " Actualizar manualmente al instante: sudo $OPT/actualizar_landing.sh"
echo " Ver registro: sudo tail -n 30 $LOG"
echo "=================================================================="
