#!/bin/sh
export SPM_AGENT_CONFIG_FILE=/etc/sematext/sematext-agent-httpd.config
export SPM_RECEIVER_URL=${SPM_RECEIVER_URL:-https://spm-receiver.sematext.com:443/receiver/v1/_bulk}
export EVENTS_RECEIVER_URL=${EVENTS_RECEIVER_URL:-https://event-receiver.sematext.com}
mkdir -p $(dirname $SPM_AGENT_CONFIG_FILE)
printf '{
	"tokens": {
		"spm": "%s"
	},
	"httpd": {
		"url": "%s"
	},
	"spmSenderBulkInsertUrl": "%s",
}' ${SPM_TOKEN} ${HTTPD_STATUS_URL} ${SPM_RECEIVER_URL} > $SPM_AGENT_CONFIG_FILE
 
sematext-agent-httpd --config $SPM_AGENT_CONFIG_FILE 
