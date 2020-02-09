# counterstake

This project has 2 parts.

## Client Webapp (/client)
- Single Page Application made with VueJS. 
Can be run locally for development with vue-cli: `npm run serve`
Then built into a dist folder that is served by Nginx: `npm run build`

## Server (/server)
- Based on an Obyte light node, reads state vars and responses from counterstake AA
- Serves rest API for webapp
To be started with: `node start.js`

#### Nginx conf for webapp and API

```
server {
	listen 80 default_server;
	server_name counterstake.org;

	location /api/ {
		proxy_pass http://localhost:1300;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection 'upgrade';
		proxy_set_header Host $host;
		proxy_cache_bypass $http_upgrade;
	}

	location  / {
		root /home/counterstats-user/counterstake/client/dist/;
		try_files $uri /index.html;
}

```