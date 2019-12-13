#!/bin/sh
':' // ; export MAX_MEM="--max-old-space-size=200"; exec "$(command -v node || command -v nodejs)" "${NODE_OPTIONS:-$MAX_MEM}" "$0" "$@" 

/*
 * @copyright Copyright (c) Sematext Group, Inc. - All Rights Reserved
 *
 * @licence SPM for Apache is free-to-use, proprietary software.
 * THIS IS PROPRIETARY SOURCE CODE OF Sematext Group, Inc. (Sematext)
 * This source code may not be copied, reverse engineered, or altered for any purpose.
 * This source code is to be used exclusively by users and customers of Sematext.
 * Please see the full license (found in LICENSE in this distribution) for details on its license and the licenses of its dependencies.
 */
var ZipZipTop = require('zip-zip-top')
var zip = new ZipZipTop()
var config = require('spm-agent').Config
var util = require('util')
var os = require('os')
var path = require('path')

var systemInfo = {
  operatingSystem: os.type() + ', ' + os.platform() + ', ' + os.release() + ', ' + os.arch(),
  processVersions: process.versions,
  processEnvironment: process.env
}

zip.file('systemInfo.txt', util.inspect(config).toString() + '\nSystem-Info:\n' + util.inspect(systemInfo))
zip.zipFolder(config.logger.dir, function (err, data) {
  if (err) {
    return console.error(err)
  }
  zip.zipFolder('/etc/sematext', function (err, data) {
    if (err) {
      return console.error(err)
    }
    var archFileName = path.join(os.tmpdir(), 'spm-diagnose.zip')
    zip.writeToFile(archFileName, (err) => {
      if (err) {
        console.error(err)
      }
    })
    console.log('Sematext diagnostics info is in  ' + archFileName)
    console.log('Please e-mail the file to support@sematext.com')
  })
})

