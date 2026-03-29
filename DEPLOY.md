# VinoVault Deployment Guide

Steps confirmed working for deploying to AWS EC2 Ubuntu.

## Prerequisites

- AWS account with EC2 access
- Domain: jadorele.vin (managed via Namecheap)
- GitHub repo: https://github.com/Stickerbox/Winery
- Anthropic API key (rotate at console.anthropic.com if compromised)
- SSH .pem key file

---

## Confirmed Steps

### 1. Patch and push from local machine

```bash
cd /Users/jordandixon/Developer/Web/Test
rm -rf node_modules
npm install
npm install next@latest
npm run build -- --webpack   # --webpack needed on Apple Silicon if native SWC bindings fail
git add package.json package-lock.json
git commit -m "fix: upgrade Next.js to patch CVE"
git push
```

### 2. AWS Console setup

1. **Release old Elastic IP** — EC2 → Elastic IPs → select IP → Actions → Release
2. **Terminate old instance** — EC2 → Instances → select → Instance state → Terminate
3. **Launch new instance**
   - AMI: Ubuntu Server 24.04 LTS
   - Instance type: t3.small
   - Key pair: existing .pem
   - Security group:
     - SSH: port 22, **My IP only**
     - HTTP: port 80, 0.0.0.0/0
     - HTTPS: port 443, 0.0.0.0/0
4. **Allocate new Elastic IP** → associate with new instance
5. **Update Namecheap DNS** — A record `@` and `www` → new Elastic IP

### 3. Install Node.js on the server

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
# Confirmed: v22.22.0 / npm 10.9.4
```

### 4. Install pm2

```bash
sudo npm install -g pm2
```

### 5. Clone repo and set env vars

```bash
git clone https://github.com/Stickerbox/Winery.git
cd Winery
echo 'DATABASE_URL="file:./dev.db"' > .env
echo 'ANTHROPIC_API_KEY="your-key-here"' > .env.local
```

### 6. Build and start with pm2

```bash
npm install
npm run build
pm2 start npm --name vinovault -- start
pm2 save
pm2 startup
# Copy and run the sudo command that pm2 startup outputs
```

### 7. Set up nginx

```bash
sudo apt-get install -y nginx
sudo nano /etc/nginx/sites-available/vinovault
```

Config:
```nginx
server {
    listen 80;
    server_name jadorele.vin www.jadorele.vin;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/vinovault /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. SSL with Let's Encrypt

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d jadorele.vin
```

Note: do not include `www.jadorele.vin` — there is no www DNS record in Namecheap.

---

## Security Hardening (run after every fresh instance)

```bash
# Firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp
sudo ufw enable

# Fail2ban
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# SSH hardening — keys only, no root
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
# Set: PermitRootLogin no
sudo systemctl restart ssh   # NOTE: Ubuntu 24.04 uses "ssh" not "sshd"

# Auto OS security patches
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
# Select "Yes" when prompted
```

---

## Re-deployment (after code changes)

```bash
# On server
cd ~/Winery
git pull
npm run build
pm2 restart vinovault
```
