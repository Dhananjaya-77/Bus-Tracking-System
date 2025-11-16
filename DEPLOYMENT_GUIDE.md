# Professional Dashboard - Setup & Deployment Guide

## 📋 Prerequisites

Before setting up the professional dashboard, ensure you have:

### System Requirements
- Python 3.8+ (for backend)
- MySQL 5.7+ or MariaDB (for database)
- Node.js 14+ (optional, for build tools)
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Software Stack
- **Backend**: Python Flask, Flask-SQLAlchemy, Flask-SocketIO
- **Database**: MySQL
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Libraries**: Leaflet.js, Chart.js, Socket.IO

## 🔧 Installation Steps

### Step 1: Database Setup

1. **Create Database**
```sql
CREATE DATABASE online_bus_tracking;
USE online_bus_tracking;
```

2. **Run Schema**
```bash
mysql -u root -p online_bus_tracking < db/schema.sql
```

3. **Seed Initial Data**
```bash
mysql -u root -p online_bus_tracking < db/seed.sql
```

### Step 2: Backend Setup

1. **Install Python Dependencies**
```bash
cd backend
pip install -r requirements.txt
```

Required packages in `requirements.txt`:
```
Flask==2.3.0
Flask-SQLAlchemy==3.0.0
Flask-JWT-Extended==4.4.0
Flask-CORS==4.0.0
Flask-SocketIO==5.3.0
python-socketio==5.9.0
python-dotenv==1.0.0
pymysql==1.0.0
bcrypt==4.0.0
```

2. **Configure Environment**

Create `.env` file:
```env
DATABASE_URI=mysql+pymysql://root:password@localhost/online_bus_tracking
SECRET_KEY=your_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_here
FLASK_ENV=production
```

3. **Initialize Database**
```bash
python
>>> from backend.app import app, db
>>> with app.app_context():
>>>     db.create_all()
>>> exit()
```

### Step 3: Frontend Setup

1. **Copy Files to Web Server**
```bash
# Copy frontend files to XAMPP htdocs
cp -r frontend/* /xampp/htdocs/OnlineBusTrackingSystem/
```

2. **Verify File Structure**
```
OnlineBusTrackingSystem/
├── index.html               (Passenger view)
├── dashboard.html           (NEW - Professional dashboard)
├── driver.html
├── admin.html
├── css/
│   ├── style.css           (Original styles)
│   └── dashboard.css       (NEW - Dashboard styles)
├── js/
│   ├── map.js              (Original map)
│   ├── map-advanced.js     (NEW - Advanced map)
│   ├── dashboard.js        (NEW - Dashboard logic)
│   └── socket.js           (WebSocket client)
└── docs/
    ├── DASHBOARD_README.md
    ├── QUICK_START.md
    └── VISUAL_GUIDE.md
```

3. **Enable CORS** (in `backend/app.py`)
```python
from flask_cors import CORS
CORS(app)
```

### Step 4: Start Services

1. **Start Backend**
```bash
python backend/app.py
```
Server starts at: `http://localhost:5000`

2. **Start Frontend Server** (if not using XAMPP)
```bash
# Option 1: Using Python
python -m http.server 8000

# Option 2: Using Node.js http-server
npx http-server -p 8000
```

3. **Access Dashboard**
Navigate to: `http://localhost:5000/dashboard.html`

## 🚀 Deployment

### Production Deployment

#### 1. Using Docker

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ backend/
COPY frontend/ frontend/

ENV FLASK_ENV=production
ENV DATABASE_URI=mysql+pymysql://user:pass@host/db

EXPOSE 5000

CMD ["python", "backend/app.py"]
```

Build and run:
```bash
docker build -t bus-tracking-dashboard .
docker run -p 5000:5000 bus-tracking-dashboard
```

#### 2. Using WSGI (Gunicorn)

1. **Install Gunicorn**
```bash
pip install gunicorn
```

2. **Create `wsgi.py`**
```python
from backend.app import app

if __name__ == "__main__":
    app.run()
```

3. **Run with Gunicorn**
```bash
gunicorn --workers 4 --bind 0.0.0.0:5000 wsgi:app
```

#### 3. Using Nginx Reverse Proxy

Create `/etc/nginx/sites-available/bus-tracking`:
```nginx
upstream bus_tracking {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name bus-tracking.example.com;

    location / {
        proxy_pass http://bus_tracking;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io {
        proxy_pass http://bus_tracking/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/bus-tracking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. SSL/HTTPS Configuration

Using Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d bus-tracking.example.com
```

### Environment Configuration

#### Development (.env)
```env
DATABASE_URI=mysql+pymysql://root:root@localhost/online_bus_tracking
SECRET_KEY=dev_secret_key_12345
JWT_SECRET_KEY=dev_jwt_secret_key_12345
FLASK_ENV=development
DEBUG=True
```

#### Production (.env)
```env
DATABASE_URI=mysql+pymysql://user:secure_pass@prod-db.example.com/bus_tracking
SECRET_KEY=prod_secret_key_very_long_random_string_12345
JWT_SECRET_KEY=prod_jwt_secret_key_very_long_random_string_12345
FLASK_ENV=production
DEBUG=False
MAX_CONTENT_LENGTH=16777216
SESSION_COOKIE_SECURE=True
SESSION_COOKIE_HTTPONLY=True
```

## 🧪 Testing

### Unit Tests

Create `tests/test_dashboard.py`:
```python
import unittest
from backend.app import app

class DashboardTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
    
    def test_dashboard_loads(self):
        response = self.app.get('/dashboard.html')
        self.assertEqual(response.status_code, 200)
    
    def test_api_buses(self):
        response = self.app.get('/api/passenger/buses')
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json, list)

if __name__ == '__main__':
    unittest.main()
```

Run tests:
```bash
python -m pytest tests/
```

### Browser Testing

Check dashboard on:
- ✅ Chrome (Windows, Mac, Linux)
- ✅ Firefox (Windows, Mac, Linux)
- ✅ Safari (Mac, iOS)
- ✅ Edge (Windows)
- ✅ Mobile browsers

### Performance Testing

Use Chrome DevTools:
1. Open Developer Tools (F12)
2. Go to "Performance" tab
3. Record page load
4. Check metrics:
   - First Paint: < 1s
   - First Contentful Paint: < 1.5s
   - Largest Contentful Paint: < 2.5s

## 🔒 Security Checklist

Before production deployment:

- [ ] Enable HTTPS/SSL
- [ ] Set secure database credentials
- [ ] Configure CORS properly
- [ ] Implement JWT authentication
- [ ] Add rate limiting
- [ ] Enable CSRF protection
- [ ] Sanitize user inputs
- [ ] Set security headers
- [ ] Configure firewall rules
- [ ] Enable database backups
- [ ] Set up monitoring/logging
- [ ] Regular security updates
- [ ] Implement API authentication
- [ ] Use environment variables for secrets
- [ ] Enable GZIP compression

## 📊 Performance Optimization

### Frontend Optimization

1. **Minify CSS/JS**
```bash
npm install -g terser uglifycss
terser frontend/js/dashboard.js -o frontend/js/dashboard.min.js
uglifycss frontend/css/dashboard.css > frontend/css/dashboard.min.css
```

2. **Enable Compression**
In Nginx:
```nginx
gzip on;
gzip_types text/plain text/css text/xml text/javascript;
gzip_min_length 1000;
```

3. **Cache Static Files**
In Nginx:
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

4. **Lazy Loading**
- Already implemented for sections
- Images use lazy loading attributes

### Backend Optimization

1. **Database Indexing**
```sql
CREATE INDEX idx_buses_status ON buses(status);
CREATE INDEX idx_buses_route ON buses(route_id);
CREATE INDEX idx_drivers_bus ON drivers(assigned_bus_id);
```

2. **Query Optimization**
Use ORM eager loading:
```python
buses = Bus.query.options(joinedload(Bus.route)).all()
```

3. **Caching**
```python
from flask_caching import Cache
cache = Cache(app, config={'CACHE_TYPE': 'simple'})

@app.route('/api/routes')
@cache.cached(timeout=300)
def get_routes():
    return jsonify(Route.query.all())
```

## 📈 Monitoring & Logging

### Set Up Logging

In `backend/app.py`:
```python
import logging
from logging.handlers import RotatingFileHandler

if not app.debug:
    if not os.path.exists('logs'):
        os.mkdir('logs')
    file_handler = RotatingFileHandler('logs/bus_tracking.log', 
                                       maxBytes=10240, 
                                       backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s '
        '[in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
```

### Monitor System Health

Create `/admin/health` endpoint:
```python
@app.route('/api/admin/health')
def health():
    return jsonify({
        'status': 'healthy',
        'database': check_db(),
        'socketio': 'connected',
        'timestamp': datetime.now().isoformat()
    })
```

## 🎯 Maintenance

### Regular Tasks

**Daily**:
- Monitor error logs
- Check WebSocket connections
- Verify data accuracy

**Weekly**:
- Database backup
- Performance review
- Security scan

**Monthly**:
- Update dependencies
- Security patches
- Feature releases

**Quarterly**:
- Full security audit
- Performance optimization
- User feedback review

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: Dashboard not loading
**Solution**:
- Check browser console (F12)
- Verify backend is running
- Check network tab for failed requests

**Issue**: Real-time updates not working
**Solution**:
- Check WebSocket connection
- Verify Socket.IO is configured
- Check browser console for errors

**Issue**: Map not displaying
**Solution**:
- Verify Leaflet library loaded
- Check browser console
- Verify coordinates are valid

### Useful Commands

```bash
# Check server status
curl http://localhost:5000/api/admin/health

# View logs
tail -f logs/bus_tracking.log

# Database backup
mysqldump -u root -p online_bus_tracking > backup.sql

# Database restore
mysql -u root -p online_bus_tracking < backup.sql
```

## 📚 Additional Resources

- [Leaflet.js Documentation](https://leafletjs.com/)
- [Chart.js Documentation](https://www.chartjs.org/)
- [Socket.IO Documentation](https://socket.io/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [MySQL Documentation](https://dev.mysql.com/)

## ✅ Deployment Checklist

Before going live:

- [ ] Database setup complete
- [ ] Backend running without errors
- [ ] Frontend files accessible
- [ ] HTTPS/SSL enabled
- [ ] Environment variables configured
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Logging configured
- [ ] Performance optimized
- [ ] Security audit completed
- [ ] User documentation ready
- [ ] Support team trained
- [ ] Rollback plan ready

## 🎉 You're Ready!

Your professional bus tracking dashboard is now deployed and ready for production use.

For questions or issues, refer to documentation or contact the support team.

---

**Last Updated**: November 2025
**Version**: 1.0.0
