# Caddy VPS Setup

This folder contains a clean starting point for running CarnivalShowcase on a VPS with Caddy in front of the Node server.

It is intentionally separate from the current GitHub + Render setup.

## What This Setup Covers

- Node app running through `systemd`
- Caddy reverse proxy on ports `80` and `443`
- automatic HTTPS for the VPS hostname and any domains you explicitly add to the Caddyfile
- shared environment-file pattern for server secrets and config

## What This Setup Now Supports

- automatic HTTPS for the platform hostname
- on-demand TLS for studio domains already approved in Firestore
- Caddy allow-list checks through `GET /api/domain/allow?domain=...`

## What Still Needs To Happen Per Studio

- the studio connects the domain in CarnivalShowcase
- the studio points DNS correctly:
  - if they own a subdomain like `album.client.com`, it should `CNAME` to your platform hostname
  - if you are directly using an apex/root domain, DNS will need a provider-specific ALIAS/ANAME/A-record strategy instead
- Caddy will only issue a certificate after the domain has been saved in Firestore and DNS points to the VPS

## Suggested VPS Layout

- App directory: `/var/www/carnivalshowcase`
- Env file: `/etc/carnivalshowcase/carnivalshowcase.env`
- Caddyfile: `/etc/caddy/Caddyfile`
- systemd service: `/etc/systemd/system/carnivalshowcase.service`

## 1. Install Runtime

Ubuntu/Debian example:

```bash
sudo apt update
sudo apt install -y nodejs npm curl debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

## 2. Put App on the Server

```bash
sudo mkdir -p /var/www/carnivalshowcase
sudo chown -R $USER:$USER /var/www/carnivalshowcase
git clone https://github.com/kaustubhmokashi/CarnivalShowcase.git /var/www/carnivalshowcase
cd /var/www/carnivalshowcase
npm install
```

## 3. Create the Env File

Use [carnivalshowcase.env.example](/Users/kaustubh.mokashi/Documents/CarnivalShowcase/caddy-vps-setup/carnivalshowcase.env.example) as a template:

```bash
sudo mkdir -p /etc/carnivalshowcase
sudo cp /var/www/carnivalshowcase/caddy-vps-setup/carnivalshowcase.env.example /etc/carnivalshowcase/carnivalshowcase.env
sudo nano /etc/carnivalshowcase/carnivalshowcase.env
```

## 4. Install the systemd Service

```bash
sudo cp /var/www/carnivalshowcase/caddy-vps-setup/carnivalshowcase.service /etc/systemd/system/carnivalshowcase.service
sudo systemctl daemon-reload
sudo systemctl enable carnivalshowcase
sudo systemctl start carnivalshowcase
sudo systemctl status carnivalshowcase
```

## 5. Install the Caddyfile

Copy [Caddyfile](/Users/kaustubh.mokashi/Documents/CarnivalShowcase/caddy-vps-setup/Caddyfile) and replace:

- `your-vps-domain.example.com`
- `your-vps-ip-or-domain:3000` only if your app is not on localhost

Then:

```bash
sudo cp /var/www/carnivalshowcase/caddy-vps-setup/Caddyfile /etc/caddy/Caddyfile
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo systemctl status caddy
```

## 6. Open Firewall Ports

```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

## 7. Deploy Updates Later

Use [deploy.sh](/Users/kaustubh.mokashi/Documents/CarnivalShowcase/caddy-vps-setup/deploy.sh):

```bash
cd /var/www/carnivalshowcase
bash caddy-vps-setup/deploy.sh
```

## Notes

- Keep the current Render setup untouched while testing this path.
- `GET /api/domain/allow` only approves:
  - the configured platform host from `CUSTOM_DOMAIN_CNAME_TARGET`
  - domains already present in the Firestore `customDomains` collection
- If the app server cannot reach Firestore through the Admin SDK, the allow-check falls back to the public Firestore REST API using the Firebase web config already present in the app env.
