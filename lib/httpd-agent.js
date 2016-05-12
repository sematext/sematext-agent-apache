/*
 * @copyright Copyright (c) Sematext Group, Inc. - All Rights Reserved
 *
 * @licence Sematext Agent for Apache is free-to-use, proprietary software.
 * THIS IS PROPRIETARY SOURCE CODE OF Sematext Group, Inc. (Sematext)
 * This source code may not be copied, reverse engineered, or altered for any purpose.
 * This source code is to be used exclusively by users and customers of Sematext.
 * Please see the full license (found in LICENSE in this distribution) for details on its license and the licenses of its dependencies.
 */
'use strict'
var Agent = require('spm-agent').Agent
var logger = require('spm-agent').Logger
var Aggregator = require('./aggregator')
var request = require('request')
var statsInterval = 2000
var emitMetricInterval = 15000
var statusParser = require('./status_parser.js')
var metricList =  [
   'Total Accesses',
   'Total kBytes',
   'CPULoad',
   'Uptime',
   'ReqPerSec',
   'BytesPerSec',
   'BytesPerReq',
   'BusyWorkers',
   'IdleWorkers',
   'ConnsTotal',
   'ConnsAsyncWriting',
   'ConnsAsyncKeepAlive',
   'ConnsAsyncClosing',
   'Scoreboard.Starting up',
   'Scoreboard.Reading Request',
   'Scoreboard.Sending Reply',
   'Scoreboard.Keepalive (read)',
   'Scoreboard.DNS Lookup',
   'Scoreboard.Closing connection',
   'Scoreboard.Logging',
   'Scoreboard.Gracefully finishing',
   'Scoreboard.Idle cleanup of worker',
   'Scoreboard.Waiting for Connection',
   'Scoreboard.Open slot with no current process'   
]

var metricsDefinition = { 
  'Total Accesses': {calcDiff: true, agg: 'sum'},
  'Total kBytes': {calcDiff: true, agg: 'sum'},
  CPULoad: {calcDiff: false, agg: 'sum'},
  Uptime: {calcDiff: true, agg: 'sum'},
  ReqPerSec: {calcDiff: false, agg: 'sum'},
  BytesPerSec: {calcDiff: false, agg: 'sum'},
  BytesPerReq: {calcDiff: false, agg: 'sum'},
  BusyWorkers: {calcDiff: false, agg: 'sum'},
  IdleWorkers: {calcDiff: false, agg: 'sum'},
  ConnsTotal: {calcDiff: false, agg: 'sum'},
  ConnsAsyncWriting: {calcDiff: false, agg: 'sum'},
  ConnsAsyncKeepAlive: {calcDiff: false, agg: 'sum'},
  ConnsAsyncClosing: {calcDiff: false, agg: 'sum'},
  'Scoreboard.Starting up':{calcDiff: false, agg: 'sum'},
  'Scoreboard.Reading Request': {calcDiff: false, agg: 'sum'},
  'Scoreboard.Sending Reply': {calcDiff: false, agg: 'sum'},
  'Scoreboard.Keepalive (read)': {calcDiff: false, agg: 'sum'},
  'Scoreboard.DNS Lookup': {calcDiff: false, agg: 'sum'},
  'Scoreboard.Closing connection': {calcDiff: false, agg: 'sum'},
  'Scoreboard.Logging': {calcDiff: false, agg: 'sum'},
  'Scoreboard.Gracefully finishing': {calcDiff: false, agg: 'sum'},
  'Scoreboard.Idle cleanup of worker': {calcDiff: false, agg: 'sum'},
  'Scoreboard.Waiting for Connection': {calcDiff: false, agg: 'sum'},
  'Scoreboard.Open slot with no current process': {calcDiff: false, agg: 'sum'} 
}

function ApacheHtttpdAgent (url) {
  var u = require('url')
  var httpdCfg = u.parse(url + '?auto')
  return new Agent({
    httpdStatusUrl: url + '?auto',
    timers: [],
    start: function (agent) {
      // config.collectionInterval=Math.min(10000, config.collectionInterval)
      // config.transmitInterval=Math.max(15000, config.transmitInterval)
      var self = this
      this.init()
      logger.info('start apache httpd agent')
      var timerId = setInterval(function () {
        self.getStats()
      }, statsInterval)
      this.timers.push(timerId)
      timerId = setInterval(function () {
        var aggMetrics = self.getAggregatedValues()
        var filters = null        
        var metrics = {type: 'httpd', filters: [], name: 'stats', fieldInfo: aggMetrics.keys, value: aggMetrics.values, sct: 'APP'}
        agent.addMetrics(metrics)
        this.agg.reset()
      }.bind(this), emitMetricInterval)
      this.timers.push(timerId)
    },
    stop: function () {
      this.timers.forEach(function (tid) {
        clearInterval(tid)
      })
    },
    init: function () {
      this.agg = new Aggregator()
    },
    getStats: function () {
      request(this.httpdStatusUrl, function (err, res) {
        if (err) {
          logger.error(err)
        } else {
          if (res.statusCode !== 200) {
            logger.error('No stats available, pls. check httpd stats URL. HTTP status: ' + res.statusCode + ' for ' + this.httpdStatusUrl)
            return
          }
          var values = statusParser(res.body) 
          if (!values['Uptime']) {
            return
          }
          for (var i = 0; i < metricList.length; i++) {
            var key = metricList[i]
            var value = Number(values[metricList[i]])
            if(key == 'Total kBytes') {
              value = Number(values[metricList[i]]) * 1024
            }
            this.agg.update(new Date().getTime(), key, value, metricsDefinition[key].calcDiff)
          }
        }
      }.bind(this))
    },
    getAggregatedValues: function () {
      var values = []
      var keys = []
      Object.keys(metricsDefinition).forEach(function (prop) {
        var val = this.agg.get(prop)
        values.push(val[metricsDefinition[prop].agg])
        keys.push(prop)
      }.bind(this))
      return {keys: keys, values: values}
    }
  })
}

module.exports = ApacheHtttpdAgent
