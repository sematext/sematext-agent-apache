#!/usr/bin/env bash
PLATFORM=$(uname)
SERVICE_NAME="sematext-agent-httpd"
UPSTART_SERVICE_FILE=/etc/init/${SERVICE_NAME}.conf
LAUNCHCTL_SERVICE_FILE="/Library/LaunchDaemons/com.sematext.${SERVICE_NAME}.plist"
SYSTEMD_SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
SPM_AGENT_CONFIG_FILE=/etc/sematext/${SERVICE_NAME}.config


uninstall () 
{
	rm $SPM_AGENT_CONFIG_FILE
	npm rm -g sematext-agent-apache
	if [[ $PLATFORM = "Darwin" ]]; then
		echo "Uninstall launchd script ${LAUNCHCTL_SERVICE_FILE}"
		launchctl stop "com.sematext.${SERVICE_NAME}"
		launchctl unload -w -F com.sematext.sematext-agent-httpd
		rm $LAUNCHCTL_SERVICE_FILE
		return
	fi

	if [[ `/sbin/init --version` =~ upstart ]]>/dev/null; then 
		echo "Uninstall ${UPSTART_SERVICE_FILE}"
		service stop $SERVICE_NAME
		return
	fi
	if [[ `systemctl` =~ -\.mount ]]; then 
		echo "Uninstall systemd script "
		systemctl stop $SERVICE_NAME
		systemctl disable $SERVICE_NAME
		rm $SYSTEMD_SERVICE_FILE
	fi
}

uninstall
