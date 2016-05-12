/*
 * @copyright Copyright (c) Sematext Group, Inc. - All Rights Reserved
 *
 * @licence Sematext Agent for Apache is free-to-use, proprietary software.
 * THIS IS PROPRIETARY SOURCE CODE OF Sematext Group, Inc. (Sematext)
 * This source code may not be copied, reverse engineered, or altered for any purpose.
 * This source code is to be used exclusively by users and customers of Sematext.
 * Please see the full license (found in LICENSE in this distribution) for details on its license and the licenses of its dependencies.
 */
var flat = require('flat')

function parseScoreboard (sb) {
  var scoreBoard = {'S': 0,'R': 0,'W': 0,'K': 0,'D': 0,'C': 0,'L': 0,'G': 0,'I': 0, '_': 0, '.': 0}
  var mapping = {
    '_': 'Waiting for Connection',
    'S': 'Starting up',
    'R': 'Reading Request',
    'W': 'Sending Reply',
    'K': 'Keepalive (read)',
    'D': 'DNS Lookup',
    'C': 'Closing connection',
    'L': 'Logging',
    'G': 'Gracefully finishing',
    'I': 'Idle cleanup of worker',
    '.': 'Open slot with no current process'
  }

  if (!sb) {
    return scoreBoard
  } else {
    sb.split('').forEach(function (val) {
      scoreBoard[val] = scoreBoard[val] + 1
    })
    var rv = {}
    Object.keys(scoreBoard).forEach(function (key) {
      rv[mapping[key]] = scoreBoard[key]
    })
    return rv
  }
}
function parseHttpdStats (txt) {
  if (/html/.test(txt)) {
    return {}
  }
  var rawMetrics = {}
  var lines = txt.split('\n')
  for (var i = 0; i < lines.length; i++) {
    var keyVal = lines[i].split(':').map(function (v) { return String(v).trim() })
    if (keyVal && keyVal.length > 1 && keyVal[0] && keyVal[0] !== '') {
      rawMetrics[keyVal[0]] = keyVal[1]
      if (keyVal[0] === 'Scoreboard') {
        rawMetrics[keyVal[0]] = parseScoreboard(keyVal[1])
      }
    }
  }
  return flat(rawMetrics)
}
module.exports = parseHttpdStats
