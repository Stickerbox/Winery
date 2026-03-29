# VinoVault Deployment Guide

Steps confirmed working for deploying to AWS EC2 Ubuntu.

## Prerequisites

- AWS account with EC2 access
- Domain: jadorele.vin (managed via DNS provider)
- GitHub repo: https://github.com/Stickerbox/Winery
- Anthropic API key (rotate at console.anthropic.com if compromised)

---

## Completed Steps

### 1. Patch Next.js locally before deploying

```bash
cd /Users/jordandixon/Developer/Web/Test
npm install next@latest
npm run build -- --webpack   # --webpack flag needed on Apple Silicon if native SWC bindings fail
git add package.json package-lock.json
git commit -m "fix: upgrade Next.js to patch CVE"
git push
```

---

## Next Steps

- [ ] Release old Elastic IP, terminate compromised instance
- [ ] Launch fresh Ubuntu EC2 instance
- [ ] Allocate new Elastic IP, associate with instance
- [ ] Update jadorele.vin DNS A record to new IP
- [ ] Install Node.js + pm2 on new instance
- [ ] Clone repo, set env vars, build, start with pm2
- [ ] Set up nginx reverse proxy
- [ ] Get Let's Encrypt SSL cert with certbot
- [ ] Reply to AWS abuse report
