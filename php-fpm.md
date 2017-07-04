# Preparation for PHP-FPM monitoring

For [PHP-FPM](http://php.net/manual/en/install.fpm.php) status monitoring activate PHP-FPM status page in your php-fpm config by removing the leading semicolon in the ```;pm.status_path = /status``` entry:

```
sudo sed -i -e "s/^;pm.status_path/pm.status_path/" /etc/php-fpm.d/www.conf
```

Or edit the file ` /etc/php-fpm.d/www.conf` manually and add the line

```
pm.status_path = /status
``` 

Restart php-fpm e.g. for upstart
```
sudo service php-fpm restart 
```

or for systemd
```
sudo systemctl restart php-fpm.service
```

Make sure that Node.js > 4.x is installed: [https://nodejs.org/en/download/package-manager/](https://nodejs.org/en/download/package-manager/)

Install sematext-agent-httpd via npm (Node package manage)
```sh
# Install sematext-agent-httpd (assuming nodejs is already installed)
sudo npm i sematext-agent-httpd -g
```

# Setup monitoring with PHP-FPM status page via unix socket (recommended)

Then run the service setup for the PHP-FPM monitoring agent. Pass the SPM Token, Apache status URL, and the PHP-FPM status URL to the setup command:
```
# If you use Sematext Cloud EU, set region for API endpoints
# sematext-httpd-setup  -r EU
# sematext-httpd-setup -t YOUR_SPM_TOKEN_HERE -u HTTPD_STATUS_URL -p PHP_FPM_STATUS_URL
sudo sematext-httpd-setup -t YOUR_SPM_TOKEN_HERE -u http://localhost/server-status -p http://unix:/var/run/php-fpm.sock:/status
```

# Setup monitoring with PHP-FPM status page via HTTP

In some scenarios, e.g. in Docker containers, the monitoring agent might not have access to the local UNIX socket. In such cases the PHP-FPM status page needs to be exposed via Apache httpd. 
To expose the PHP-FPM status page via Apache httpd change the configuration ```/etc/httpd/conf.d/mod_fastcgi.conf``` e.g.:

```
LoadModule fastcgi_module modules/mod_fastcgi.so
 
<IfModule mod_fastcgi.c>
	DirectoryIndex index.php index.html index.shtml index.cgi
	AddHandler php5-fcgi .php
	Action php5-fcgi /php5-fcgi
	Alias /php5-fcgi /usr/lib/cgi-bin/php5-fcgi
	FastCgiExternalServer /usr/lib/cgi-bin/php5-fcgi -socket /var/run/php-fpm.sock -pass-header Authorization
 
	# For monitoring status with e.g. SPM for Apache httpd
	<LocationMatch "/(ping|status)">
		SetHandler php5-fcgi-virt
		Action php5-fcgi-virt /php5-fcgi virtual
	</LocationMatch>
</IfModule>
```

Then run the setup command using HTTP URLs for status pages:

```
  # sematext-httpd-setup YOUR_SPM_TOKEN_HERE HTTPD_STATUS_URL PHP_FPM_STATUS_URL
  sudo sematext-nginx-setup YOUR_SPM_TOKEN_HERE http://localhost/server-status http://localhost/status
```

