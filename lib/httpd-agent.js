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
var statsInterval = 5000
var emitMetricInterval = 15000
var statusParser = require('./status-parser.js')
var metricList = [
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
  CPULoad: {calcDiff: false, agg: 'mean'},
  Uptime: {calcDiff: true, agg: 'mean'},
  ReqPerSec: {calcDiff: false, agg: 'mean'},
  BytesPerSec: {calcDiff: false, agg: 'mean'},
  BytesPerReq: {calcDiff: false, agg: 'mean'},
  BusyWorkers: {calcDiff: false, agg: 'mean'},
  IdleWorkers: {calcDiff: false, agg: 'mean'},
  ConnsTotal: {calcDiff: false, agg: 'mean'},
  ConnsAsyncWriting: {calcDiff: false, agg: 'mean'},
  ConnsAsyncKeepAlive: {calcDiff: false, agg: 'mean'},
  ConnsAsyncClosing: {calcDiff: false, agg: 'mean'},
  'Scoreboard.Starting up': {calcDiff: false, agg: 'mean'},
  'Scoreboard.Reading Request': {calcDiff: false, agg: 'mean'},
  'Scoreboard.Sending Reply': {calcDiff: false, agg: 'mean'},
  'Scoreboard.Keepalive (read)': {calcDiff: false, agg: 'mean'},
  'Scoreboard.DNS Lookup': {calcDiff: false, agg: 'mean'},
  'Scoreboard.Closing connection': {calcDiff: false, agg: 'mean'},
  'Scoreboard.Logging': {calcDiff: false, agg: 'mean'},
  'Scoreboard.Gracefully finishing': {calcDiff: false, agg: 'mean'},
  'Scoreboard.Idle cleanup of worker': {calcDiff: false, agg: 'mean'},
  'Scoreboard.Waiting for Connection': {calcDiff: false, agg: 'mean'},
  'Scoreboard.Open slot with no current process': {calcDiff: false, agg: 'mean'}
}

function ApacheHtttpdAgent (url, options) {
  var urlParser = require('url')
  var filterValue = urlParser.parse(url).host
  if (options.emitMetricInterval && Number(options.sendInterval) > 0) {
    emitMetricInterval = Number(options.sendInterval) * 1000
  }
  if (options.collectionInterval && (Number(options.collectionInterval) * 1000) < emitMetricInterval) {
    statsInterval = Number(options.collectionInterval) * 1000
  }
  var ag = new Agent({
    httpdStatusUrl: url + '?auto',
    timers: [],
    filterValue: filterValue,
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
        var metrics = {type: 'httpd', filters: [self.filterValue], name: 'stats', fieldInfo: aggMetrics.keys, value: aggMetrics.values, sct: 'APP'}
        agent.addMetrics(metrics)
        this.agg.reset()
      }.bind(this), emitMetricInterval)
      this.timers.push(timerId)
      if (this.phpFpmMonitor) {
        this.phpFpmMonitor.start()
      }
    },
    stop: function () {
      this.timers.forEach(function (tid) {
        clearInterval(tid)
      })
      if (this.phpFpmMonitor) {
        this.phpFpmMonitor.stop()
      }
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
            if (key === 'Total kBytes') {
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
  if (options && options.phpFpmUrl && options.phpFpmUrl !== 'undefined') {
    var PhpFpmMonitor = require('./fpmMonitor.js')
    ag.phpFpmMonitor = new PhpFpmMonitor({url: options.phpFpmUrl, collectionInterval: Number(options.collectionInterval) || 10000, agent: ag, filterValue: filterValue})
  }
  return ag
}

module.exports = ApacheHtttpdAgent
