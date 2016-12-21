#!/bin/sh
':' // ; export MAX_MEM="--max-old-space-size=60"; exec "$(command -v node || command -v nodejs)" "${NODE_OPTIONS:-$MAX_MEM}" "$0" "$@" 

/*
 * @copyright Copyright (c) Sematext Group, Inc. - All Rights Reserved
 *
 * @licence Sematext Agent for Apache is free-to-use, proprietary software.
 * THIS IS PROPRIETARY SOURCE CODE OF Sematext Group, Inc. (Sematext)
 * This source code may not be copied, reverse engineered, or altered for any purpose.
 * This source code is to be used exclusively by users and customers of Sematext.
 * Please see the full license (found in LICENSE in this distribution) for details on its license and the licenses of its dependencies.
 */
// this requires are here to compile with enclose.js 
var packageJson = require('../package.json')
var packageJson2 = require('spm-agent/package.json')

function HttpdMonitor () {
  // config.collectionInterval = 1000
  var SpmAgent = require('spm-agent')
  var osAgent = require('spm-agent-os')
  var httpdAgent = require('./httpd-agent')
  console.log('SPM Token: ' + (SpmAgent.Config.get('tokens.spm') || '').slice(0,16) + ' ...')
  var httpdUrl = 'http://localhost/server-status'
  if (SpmAgent.Config.get('httpd.url')) {
    httpdUrl = SpmAgent.Config.get('httpd.url') || ''
    var secureUrl = httpdUrl.replace(/:.*@/i, ' ')
    console.log('httpd url: ' + secureUrl)
  } else {
    console.error('Missing httpd status url in config ' + SpmAgent.Config.config)
    process.exit(1)
  }
  var njsAgent = new SpmAgent()
  var agentsToLoad = [
    httpdAgent,
    osAgent
  ]
  agentsToLoad.forEach(function (a) {
    try {
      var Monitor = a
      if (a === httpdAgent) {
        njsAgent.createAgent(new Monitor(httpdUrl, {phpFpmUrl: SpmAgent.Config.get('phpFpm.url')}))
      } else {
        njsAgent.createAgent(new Monitor())
      }
    } catch (err) {
      console.log(err)
      SpmAgent.Logger.error('Error loading agent ' + a + ' ' + err)
    }
  })
  return njsAgent
}
HttpdMonitor()

process.on('uncaughtException', function (err) {
  console.error((new Date()).toUTCString() + ' uncaughtException:', err.message)
  console.error(err.stack)
  process.exit(1)
})
