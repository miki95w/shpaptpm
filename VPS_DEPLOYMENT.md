# Solta Hotel Apartment · Linux VPS Deployment Guide (LEMP Stack)

This guide walks you through deploying and running the **Solta Hotel Apartment Operations Platform (PMS)** on any standard Linux VPS (Ubuntu 22.04 / 24.04 LTS, Debian, or AlmaLinux) using high-performance **Nginx**, **PHP 8.2/8.3-FPM**, and **MySQL 8.0**.

---

## 🏗️ Architecture Overview

On your VPS, the application runs on the standard **LEMP stack**:
- **Nginx:** High-concurrency web server handling SSL termination, static React assets (`dist/`), and reverse routing.
- **PHP-FPM:** FastCGI process manager executing the lightweight REST API (`api/`).
- **MySQL / MariaDB:** Relational database storing the 17 operational tables from `schema.sql`.
- **Certbot (Let's Encrypt):** Automated free SSL certificates with auto-renewal.

---

## ⚡ Quick 5-Step Deployment Walkthrough

### Step 1: Update Server & Install the LEMP Stack

Connect to your VPS via SSH as `root` (or a sudo user):
```bash
ssh root@YOUR_VPS_IP
```

Install Nginx, MySQL, PHP-FPM, and necessary extensions:
```bash
# Update package repositories
sudo apt update && sudo apt upgrade -y

# Install Nginx, MySQL Server, PHP-FPM, Unzip, and Certbot
sudo apt install -y nginx mysql-server php-fpm php-mysql php-curl php-json php-mbstring php-xml php-zip unzip certbot python3-certbot-nginx

# Ensure services are enabled and running
sudo systemctl enable nginx mysql php$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')-fpm
sudo systemctl start nginx mysql
```

---

### Step 2: Configure MySQL Database

Open MySQL command-line prompt:
```bash
sudo mysql
```

Run the following SQL commands (replace `YourStrongPassword123!` with your own secure password):
```sql
-- 1. Create the PMS database
CREATE DATABASE solta_pms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Create the dedicated database user
CREATE USER 'solta_user'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';

-- 3. Grant full permissions to the database
GRANT ALL PRIVILEGES ON solta_pms.* TO 'solta_user'@'localhost';

-- 4. Apply changes & exit
FLUSH PRIVILEGES;
EXIT;
```

---

### Step 3: Upload & Unpack the Application

Create the web root directory on your VPS:
```bash
sudo mkdir -p /var/www/solta
```

From your **local machine** (in your project directory `/home/toptech/solta`), transfer the pre-built deployment archive:
```bash
scp solta_cpanel_upload.zip root@YOUR_VPS_IP:/tmp/
```

Back on your **VPS**, unzip and configure permissions:
```bash
# Extract the archive into web root
sudo unzip -o /tmp/solta_cpanel_upload.zip -d /var/www/solta

# Set correct ownership for web server user (www-data)
sudo chown -R www-data:www-data /var/www/solta
sudo find /var/www/solta -type d -exec chmod 755 {} \;
sudo find /var/www/solta -type f -exec chmod 644 {} \;

# Clean up temporary zip
rm /tmp/solta_cpanel_upload.zip
```

---

### Step 4: Import Database Schema & Configure Credentials

Import all 17 database tables, default roles, permissions, and initial Solta rooms:
```bash
sudo mysql -u solta_user -p solta_pms < /var/www/solta/schema.sql
```
*(Enter `YourStrongPassword123!` when prompted)*

Now update the database credentials in `/var/www/solta/api/config.php`:
```bash
sudo nano /var/www/solta/api/config.php
```

Ensure lines 12–16 match your database credentials:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'solta_pms');
define('DB_USER', 'solta_user');
define('DB_PASS', 'YourStrongPassword123!');
define('DB_PORT', '3306');
define('DEV_MODE', false);
```
*Press `Ctrl + O` and `Enter` to save, then `Ctrl + X` to exit.*

---

### Step 5: Configure Nginx & SSL Certificate

Find your active PHP-FPM socket version:
```bash
ls /run/php/php*-fpm.sock
# Example output: /run/php/php8.3-fpm.sock (or php8.2-fpm.sock)
```

Create a new Nginx configuration file for Solta:
```bash
sudo nano /etc/nginx/sites-available/solta
```

Paste the following production configuration (replace `yourdomain.com` with your actual domain or VPS IP):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com; # Or your VPS IP

    root /var/www/solta;
    index index.html index.php;

    # Maximum file upload size
    client_max_body_size 25M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml image/svg+xml;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Block access to hidden, database, and sensitive config files
    location ~* \.(sql|env|git|htaccess|bak|log)$ {
        deny all;
        return 404;
    }

    # API Endpoints -> Processed by PHP-FPM
    location /api/ {
        try_files $uri $uri/ /api/data.php?$args;

        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            # Update socket path to match your PHP version:
            fastcgi_pass unix:/run/php/php8.3-fpm.sock;
            fastcgi_index index.php;
            fastcgi_read_timeout 60s;
        }
    }

    # Direct PHP file handler (for install/health if used)
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
    }

    # Static Assets Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
        try_files $uri =404;
    }

    # Single Page Application (SPA) Fallback Routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```
*Save and exit (`Ctrl + O`, `Enter`, `Ctrl + X`).*

Enable the site and test Nginx configuration:
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/solta /etc/nginx/sites-enabled/

# Remove default site if present
sudo rm -f /etc/nginx/sites-enabled/default

# Test syntax
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

### Step 6: Install Free SSL Certificate (HTTPS)

Once your domain DNS `A` record points to your VPS IP address, obtain a free Let's Encrypt certificate:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
Follow the interactive prompt:
- Enter your email address for renewal notices.
- Agree to terms (`Y`).
- Choose option `2` (Redirect HTTP traffic to HTTPS).

Certbot will automatically configure SSL renewal via systemd timer.

---

### Step 7: Post-Install Security Hardening

Delete the installer script to prevent any external re-initialization:
```bash
sudo rm -f /var/www/solta/api/install.php
```

Log in to your workspace at `https://yourdomain.com/`:
- **Default Email:** `admin@gmail.com`
- **Default Password:** `admin123`
- *Immediately go to **Access & Roles** &rarr; edit user &rarr; set your secure private password.*

---

## 🛠️ Maintenance & Useful Commands

### Check Service Status
```bash
sudo systemctl status nginx
sudo systemctl status php8.3-fpm
sudo systemctl status mysql
```

### View Live API & Error Logs
```bash
# Nginx Error Log
sudo tail -f /var/log/nginx/error.log

# Nginx Access Log
sudo tail -f /var/log/nginx/access.log

# PHP-FPM Error Log
sudo tail -f /var/log/php8.3-fpm.log
```

### Restart Services After Edits
```bash
sudo systemctl restart nginx
sudo systemctl restart php8.3-fpm
sudo systemctl restart mysql
```

### Create a Database Backup
```bash
sudo mysqldump -u solta_user -p solta_pms > ~/solta_pms_backup_$(date +%F).sql
```
