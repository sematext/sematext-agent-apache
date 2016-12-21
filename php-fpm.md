# Preparation for PHP-FPM monitoring

For [PHP-FPM](http://php.net/manual/en/install.fpm.php) status monitoring activate PHP-FPM status page in your php-fpm config by removing the leading semicolon in the ```;pm.status_path = /status``` entry:

```
sed -i -e "s/^;pm.status_path/pm.status_path/" /etc/php5/php-fpm.conf
```

# Setup monitoring with PHP-FPM status page via unix socket 

```sh
# Install sematext-agent-httpd (assuming nodejs is already installed)
npm i sematext-agent-httpd -g
```

Then run the service setup for the PHP-FPM monitoring agent. Pass the SPM Token, Apache status URL, and the PHP-FPM status URL to the setup command:
```
# sematext-httpd-setup YOUR_SPM_TOKEN_HERE HTTPD_STATUS_URL PHP_FPM_STATUS_URL
sematext-httpd-setup YOUR_SPM_TOKEN_HERE http://localhost/server-status http://unix:/var/run/php-fpm.sock:/status
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
  sematext-nginx-setup YOUR_SPM_TOKEN_HERE http://localhost/server-status http://localhost/status
```

