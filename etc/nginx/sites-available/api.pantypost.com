# /etc/nginx/sites-available/api.pantypost.com

server {
    listen 80;
    listen [::]:80;
    server_name api.pantypost.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.pantypost.com;

    ssl_certificate /etc/letsencrypt/live/api.pantypost.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.pantypost.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256;

    client_max_body_size 50m;

    # Serve uploaded files directly from disk
    location /uploads/ {
        alias /var/www/pantypost/uploads/;
        autoindex off;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Access-Control-Allow-Origin "https://pantypost.com" always;
        add_header Access-Control-Allow-Credentials "true" always;
        try_files $uri =404;
    }

    # API proxy
    location /api {
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "https://pantypost.com" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-CSRF-Token" always;
            add_header Access-Control-Allow-Credentials "true" always;
            return 204;
        }

        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        add_header Access-Control-Allow-Origin "https://pantypost.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-CSRF-Token" always;
        add_header Access-Control-Allow-Credentials "true" always;
    }

    # WebSockets
    location /socket.io {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Public WebSocket
    location /public-ws {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Root
    location / {
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://pantypost.com" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-CSRF-Token" always;
            add_header Access-Control-Allow-Credentials "true" always;
            return 204;
        }
        default_type application/json;
        add_header Access-Control-Allow-Origin "https://pantypost.com" always;
        add_header Access-Control-Allow-Credentials "true" always;
        return 200 '{"status":"ok","message":"PantyPost API Server"}';
    }
}