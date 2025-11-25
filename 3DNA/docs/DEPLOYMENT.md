# Deployment Guide - 3DNA Bus Tracking System

## Quick Start (5 minutes)

### Prerequisites
- XAMPP 7.4+
- MySQL running
- Modern web browser
- PHP 7.4+

### Steps

1. **Extract Project**
   ```bash
   Extract to: C:\xampp\htdocs\3DNA-Bus-Tracking\
   ```

2. **Import Database**
   ```
   phpMyAdmin: http://localhost/phpmyadmin
   - Import: database/schema.sql
   - Database: bus_tracking_db
   ```

3. **Configure Connection**
   Edit: `backend/config/Database.php`
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'root');
   define('DB_PASS', '');  // Your password
   define('DB_NAME', 'bus_tracking_db');
   ```

4. **Start Apache & MySQL**
   ```
   XAMPP Control Panel → Start Apache & MySQL
   ```

5. **Access Application**
   ```
   Landing: http://localhost/3DNA-Bus-Tracking/frontend/pages/index.html
   Map: http://localhost/3DNA-Bus-Tracking/frontend/pages/tracking-map.html
   ```

---

## Detailed Installation

### Step 1: Database Setup

#### Method A: Using phpMyAdmin (GUI)
1. Open http://localhost/phpmyadmin
2. Click "Import" tab
3. Select `database/schema.sql`
4. Click "Go"
5. Verify `bus_tracking_db` created with 7 tables

#### Method B: Command Line
```bash
# Open MySQL
mysql -u root -p

# Create and populate
CREATE DATABASE bus_tracking_db;
USE bus_tracking_db;
SOURCE C:/xampp/htdocs/3DNA-Bus-Tracking/database/schema.sql;

# Verify
SHOW TABLES;
SELECT COUNT(*) FROM users;
```

#### Method C: Windows Command
```batch
cd C:\xampp\mysql\bin
mysql -u root < C:\xampp\htdocs\3DNA-Bus-Tracking\database\schema.sql
```

### Step 2: File Permissions

```bash
# Windows (PowerShell as Admin)
icacls "C:\xampp\htdocs\3DNA-Bus-Tracking" /grant Users:F /T

# Linux/Mac
chmod -R 755 /var/www/3DNA-Bus-Tracking/
chmod -R 777 /var/www/3DNA-Bus-Tracking/backend/
```

### Step 3: Configuration

Edit `backend/config/Database.php`:
```php
<?php
define('DB_HOST', 'localhost');      // MySQL host
define('DB_USER', 'root');           // MySQL user
define('DB_PASS', '');               // MySQL password
define('DB_NAME', 'bus_tracking_db'); // Database name

// Optional: API settings
define('API_TIMEOUT', 30);           // Seconds
define('MAX_CONNECTIONS', 100);
?>
```

### Step 4: Configure Web Server

#### Apache (XAMPP)
Edit `apache/conf/httpd.conf`:
```apache
# Enable mod_rewrite
LoadModule rewrite_module modules/mod_rewrite.so

# Virtual Host (optional)
<VirtualHost *:80>
    ServerName bus-tracking.local
    DocumentRoot "C:/xampp/htdocs/3DNA-Bus-Tracking"
    
    <Directory "C:/xampp/htdocs/3DNA-Bus-Tracking">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

Create `.htaccess` in project root:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /3DNA-Bus-Tracking/
    
    # Route API requests
    RewriteRule ^api/(.*)$ /3DNA-Bus-Tracking/backend/api/$1 [QSA,L]
</IfModule>
```

### Step 5: Test Installation

1. **Check Database**
   ```sql
   SELECT * FROM users LIMIT 1;
   -- Should return admin user
   ```

2. **Test API**
   ```
   http://localhost/3DNA-Bus-Tracking/backend/api/buses.php?action=list
   -- Should return JSON
   ```

3. **Test Frontend**
   ```
   http://localhost/3DNA-Bus-Tracking/frontend/pages/index.html
   -- Should display landing page
   ```

---

## Production Deployment

### Pre-Production Checklist

- [ ] Database backed up
- [ ] HTTPS configured with SSL
- [ ] PHP security settings reviewed
- [ ] MySQL user privileges restricted
- [ ] API rate limiting enabled
- [ ] CORS headers configured
- [ ] Environment variables set
- [ ] Error logging configured
- [ ] Database indexes verified
- [ ] Performance optimization done

### Deployment Steps

1. **Server Setup**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install php7.4 mysql-server apache2
   
   # Enable PHP modules
   sudo a2enmod rewrite
   sudo a2enmod php7.4
   ```

2. **Clone Repository**
   ```bash
   cd /var/www/html
   git clone https://github.com/3dna/bus-tracking.git
   cd bus-tracking
   ```

3. **Database Migration**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

4. **Environment Configuration**
   Create `.env` file:
   ```
   DB_HOST=localhost
   DB_USER=bus_user
   DB_PASS=secure_password_here
   DB_NAME=bus_tracking_prod
   API_URL=https://api.3dna-tracking.com
   JWT_SECRET=your_jwt_secret_key
   ```

5. **Security Hardening**
   ```bash
   # Set permissions
   chmod 750 backend/
   chmod 750 database/
   chmod 755 frontend/
   
   # Create logs directory
   mkdir -p logs
   chmod 755 logs
   ```

6. **SSL Configuration**
   ```apache
   <VirtualHost *:443>
       ServerName api.3dna-tracking.com
       SSLEngine on
       SSLCertificateFile /path/to/certificate.crt
       SSLCertificateKeyFile /path/to/private.key
       
       DocumentRoot /var/www/html/bus-tracking
   </VirtualHost>
   ```

7. **Verify Deployment**
   ```bash
   # Test API endpoint
   curl https://api.3dna-tracking.com/backend/api/buses.php?action=stats
   
   # Check error logs
   tail -f /var/log/apache2/error.log
   ```

---

## Environment Variables

Create `/backend/.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=bus_tracking_db

# API
API_TIMEOUT=30
MAX_REQUESTS_PER_MINUTE=60

# Security
JWT_SECRET=your_secret_key_here
SESSION_TIMEOUT=3600

# Email (for future features)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=noreply@3dna-tracking.com
MAIL_PASS=app_password

# Maps API (optional)
GOOGLE_MAPS_KEY=your_key_here
MAPBOX_TOKEN=your_token_here
```

---

## Troubleshooting

### Database Connection Failed
```php
// Test connection
try {
    $pdo = new PDO('mysql:host=localhost', 'root', '');
    echo "Connected!";
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}
```

### 404 Errors on API
- Check `.htaccess` in root and backend folder
- Verify mod_rewrite enabled: `apache2ctl -M | grep rewrite`
- Check Apache error log

### CORS Errors
Add to `backend/api/` files:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
```

### Geolocation Permission Denied
- Ensure HTTPS in production
- Check browser geolocation settings
- Add site to location permission whitelist

### Map Not Loading
- Verify Leaflet CDN is accessible
- Check OpenStreetMap availability
- Check browser console for JavaScript errors

---

## Backup & Recovery

### Backup Database
```bash
# Full backup
mysqldump -u root -p bus_tracking_db > backup_$(date +%Y%m%d).sql

# Scheduled backup (Linux cron)
0 2 * * * mysqldump -u root -p bus_tracking_db > /backups/db_$(date +\%Y\%m\%d).sql
```

### Backup Files
```bash
# ZIP entire project
tar -czf 3dna-backup-$(date +%Y%m%d).tar.gz 3DNA-Bus-Tracking/

# Exclude large files
tar --exclude='logs/*' --exclude='node_modules' -czf backup.tar.gz 3DNA-Bus-Tracking/
```

### Restore Database
```bash
# From backup
mysql -u root -p bus_tracking_db < backup_20251122.sql

# Restore single table
mysql -u root -p bus_tracking_db < backup_users_table.sql
```

---

## Performance Optimization

### Database
```sql
-- Add indexes for frequent queries
CREATE INDEX idx_bus_location ON driver_locations(bus_id, created_at);
CREATE INDEX idx_route_active ON routes(is_active);

-- Archive old data
DELETE FROM driver_locations WHERE DATE(created_at) < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### PHP
```php
// Enable output compression
if (extension_loaded('zlib')) {
    ini_set('zlib.output_compression', 'On');
}

// Cache headers
header('Cache-Control: public, max-age=300');
header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 300) . ' GMT');
```

### Frontend
```javascript
// Lazy load maps
function initMapWhenVisible() {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            initMap();
        }
    });
    observer.observe(document.getElementById('map'));
}
```

---

## Monitoring & Logging

### Apache Logs
```
Access: /var/log/apache2/access.log
Errors: /var/log/apache2/error.log
```

### PHP Logging
```php
// Log to file
error_log("Bus tracking error: " . $e->getMessage(), 3, "/var/log/php-errors.log");

// Set in php.ini
log_errors = On
error_log = /var/log/php-errors.log
```

### Monitor API Performance
```bash
# Real-time monitoring
watch -n 1 'tail -n 20 /var/log/apache2/error.log'

# Response time statistics
ab -n 100 -c 10 http://localhost/api/buses.php?action=list
```

---

## Scaling Considerations

### Horizontal Scaling
1. Load balancer (Nginx)
2. Multiple PHP servers
3. Separate database server
4. Redis for caching

### Vertical Scaling
1. Increase server resources
2. Optimize database queries
3. Enable query caching
4. Use CDN for static files

---

## Maintenance

### Regular Tasks
- Daily: Monitor error logs
- Weekly: Review performance metrics
- Monthly: Database maintenance, backups
- Quarterly: Security updates, dependency updates

### Updates
```bash
# PHP
sudo apt-get install php7.4-updates

# MySQL
sudo mysql_upgrade

# SSL certificates
# Use Let's Encrypt for automatic renewal
```

---

## Support

- **Documentation**: `/docs/README.md`
- **API Guide**: `/docs/API.md`
- **Architecture**: `/docs/ARCHITECTURE.md`
- **Issues**: GitHub Issues or support email

---

**Last Updated:** November 2025
**Version:** 1.0

