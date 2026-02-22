# Poseidon Geodynamics Website

## Site: poseidongeodynamics.com

## Hosting

| Field         | Value                                           |
| ------------- | ----------------------------------------------- |
| **Registrar** | Squarespace Domains (formerly Google Domains)   |
| **DNS**       | Squarespace Domains DNS                         |
| **Hosting**   | GitHub Pages                                    |
| **Repo**      | `megalopolisms/poseidongeodynamics`             |
| **Branch**    | `main` (deploy from `/`)                        |
| **HTTPS**     | Enforced (GitHub auto-provisions Let's Encrypt) |
| **CNAME**     | `poseidongeodynamics.com`                       |

## DNS Configuration (Squarespace Domains)

### Required DNS Records

| Type  | Host | Value                   | TTL  |
| ----- | ---- | ----------------------- | ---- |
| A     | @    | 185.199.108.153         | 3600 |
| A     | @    | 185.199.109.153         | 3600 |
| A     | @    | 185.199.110.153         | 3600 |
| A     | @    | 185.199.111.153         | 3600 |
| CNAME | www  | megalopolisms.github.io | 3600 |

### Steps to Configure

1. Go to https://domains.squarespace.com
2. Select `poseidongeodynamics.com`
3. Go to DNS → DNS Settings → Custom Records
4. Delete any existing A records for `@`
5. Add the 4 A records above (GitHub Pages IPs)
6. Add the CNAME record for `www` → `megalopolisms.github.io`
7. Wait 10-30 minutes for propagation
8. GitHub will auto-provision HTTPS certificate

## Stack

- **Type:** Static HTML/CSS/JS (no build step)
- **CSS:** Tailwind CSS (CDN)
- **JS:** Vanilla JS
- **Fonts:** Inter, Montserrat
- **No Jekyll** (`.nojekyll` file present)

## Brand

| Element             | Value                     |
| ------------------- | ------------------------- |
| **Primary Color**   | Deep ocean blue `#1a3a5c` |
| **Secondary Color** | Trident gold `#c9a84c`    |
| **Accent Color**    | Seafoam/teal `#2da8a0`    |
| **Dark**            | Charcoal `#1e1e2e`        |
| **Light**           | Off-white `#f7f8fa`       |
| **Logo**            | `assets/poseidon.jpg`     |
| **Tagline**         | "Engineered Foundations"  |

## Company Info

| Field        | Value                                 |
| ------------ | ------------------------------------- |
| **Name**     | Poseidon Geodynamics LLC              |
| **Partners** | Yuri Petrini, Jarrod                  |
| **Address**  | 929 Division Street, Biloxi, MS 39530 |
| **Phone**    | (305) 504-1323                        |
| **Email**    | contact@poseidongeodynamics.com       |
| **Industry** | Helical Piles / Deep Foundations      |

## MCP Integration

- **MCP-57-poseidon** at `/Users/yuri/Dropbox/mcp-servers/MCP-57-poseidon/`
- Website content managed via `poseidon_website_content` and `poseidon_blog` tools
- Product data from MCP database

## Deployment

```bash
# Push to deploy (GitHub Pages auto-builds from main)
cd /Users/yuri/poseidongeodynamics
git add -A && git commit -m "update" && git push

# Verify DNS
dig poseidongeodynamics.com +short
dig www.poseidongeodynamics.com +short

# Check HTTPS cert
curl -sI https://poseidongeodynamics.com | head -5
```

## File Structure

```
poseidongeodynamics/
├── CNAME                    # Custom domain
├── .nojekyll                # Bypass Jekyll
├── CLAUDE.md                # This file
├── index.html               # Home page
├── about.html               # About page
├── services.html            # Services page
├── products.html            # Products page
├── contact.html             # Contact / Quote page
├── blog.html                # Blog listing
├── blog/                    # Blog posts
├── assets/
│   ├── poseidon.jpg         # Logo
│   ├── css/
│   │   └── style.css        # Custom styles
│   └── js/
│       └── main.js          # Site scripts
├── sitemap.xml              # SEO sitemap
└── robots.txt               # Crawler config
```
