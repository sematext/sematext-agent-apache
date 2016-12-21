[![bitHound Overalll Score](https://www.bithound.io/github/sematext/sematext-agent-apache/badges/score.svg)](https://www.bithound.io/github/sematext/sematext-agent-apache) [![Build Status](https://travis-ci.org/sematext/sematext-agent-apache.svg?branch=master)](https://travis-ci.org/sematext/sematext-agent-apache)

This is the Apache httpd monitoring Agent for [SPM Performance Monitoring](http://sematext.com/spm/)


# Preparation 

1. Get a free account at [sematext.com/spm](https://apps.sematext.com/users-web/register.do)  

2. [Create an SPM App](https://apps.sematext.com/spm-reports/registerApplication.do) of type "Apache" and copy the SPM Application Token - or execute the commands displayed in the Sematext UI (which are described here as well)

3. [Install Node.js](https://nodejs.org/en/download/package-manager/) on your Apache httpd server

4. Activate Apache ```mod_status``` module with ```sudo a2enmod status``` and configure it in the file ```/etc/apache2/mods-enabled/status.conf```: 
```
<Location /server-status>
                SetHandler server-status
</Location>
```      

__Optional preparation for PHP FastCGI Process Manager (FPM):__ To add monitoring for PHP-FPM follow [this instructions](https://github.com/sematext/sematext-agent-httpd/blob/master/php-fpm.md).  

# Setup 
```sh
# Install sematext-agent-httpd 
npm i sematext/sematext-agent-httpd -g
# Install systemd or upstart service file for sematext-agent-httpd 
sematext-httpd-setup YOUR_SPM_TOKEN_HERE http://localhost/server-status
```
# Configuration 

The setup script stores the configuration in ```/etc/sematext/sematext-agent-httpd.config```

In case you want to change settings later edit ```/etc/sematext/sematext-agent-httpd.config```. Restart the Sematext Apache Agent after config changes, depending on the init system:
- Upstart (Ubuntu):  
```
    sudo service sematext-agent-httpd restart 
```
- Systemd (Linux others):  
```
    sudo systemctl stop sematext-agent-httpd
    sudo systemctl start sematext-agent-httpd
```
- Launchd (Mac OS X): 
```
    sudo launchctl stop com.sematext.sematext-agent-httpd
    sudo launchctl stop com.sematext.sematext-agent-httpd
```

For tests you can just run the agent from command line:
```
sematext-agent-httpd --config /etc/sematext/sematext-agent-httpd.config
```

# Results

Apache Metrics in SPM: 
![](https://raw.githubusercontent.com/sematext/sematext-agent-apache/master/httpd-report-screenshot.png)

# Docker 

Sematext Agent for Apache includes a docker file and startup script to build a Docker image. 
```
git clone https://github.com/sematext/sematext-agent-apache.git
cd sematext-agent-apache
docker build -t sematext/sematext-agent-apache .
```

The Sematext Apache Agent supports following parameters on Docker: 

| Environment Variable | Description |
|----------------------|-------------|
| **Required parameters**  |         |
| SPM_TOKEN                | your SPM Token for the Apache SPM App |
| HTTPD_STATUS_URL          | the URL to httpd server, delivering the stats (see httpd configuration above). Please note the servername/ip must be reachable from the agent container. You might need to use --link Apache container-name to create the network link. |
| Optional parameters      | |
| PHP_FPM_STATUS_URL | PHP FastCGI status url |
| HTTPS_PROXY              | Url to HTTPS proxy if the agent runs behind a firewall |
| SPM_RECEIVER_URL         | Optional for SPM On-Premises, default value: https://spm-receiver.sematext.com:443/receiver/v1/_bulk |
| EVENTS_RECEIVER_URL      | Optional for SPM On-Premises, default value: https://event-receiver.sematext.com |


Example:
```
docker run --name sematext-agent-httpd -e SPM_TOKEN=YOUR_SPM_APACHE_TOKEN_HERE  \ 
-e HTTPD_STATUS_URL=http://httpd-server/server-status \ 
-d  sematext/sematext-agent-httpd
```

# Support 

- Twitter: [@sematext](http://www.twitter.com/sematext)
- Blog: [blog.sematext.com](http://blog.sematext.com)
- Homepage: [www.sematext.com](http://www.sematext.com)

