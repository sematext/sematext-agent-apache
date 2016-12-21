# Preparation for PHP-FPM monitoring

For [PHP-FPM](http://php.net/manual/en/install.fpm.php) status monitoring activate PHP-FPM status page in your php-fpm config by removing the leading semicolon in the ```;pm.status_path = /status``` entry:

```
sed -i -e "s/^;pm.status_path/pm.status_path/" /etc/php5/php-fpm.conf
```

# Setup httpd Agent

```sh
# Install sematext-agent-httpd (assuming nodejs is already installed)
npm i sematext-agent-httpd -g
```

Then run the service setup for the PHP-FPM monitoring agent. Pass the SPM Token, Nginx status URL, and the PHP-FPM status URL to the setup command:
```
sematext-httpd-setup YOUR_SPM_TOKEN_HERE http://localhost/server-status http://unix:/var/run/php-fpm.sock:/status
```


