const _ = require('./_')
// http://nodejs.org/api/os.html
const os = require('os')
// https://www.npmjs.org/package/humanize-duration
const humanize = require('humanize-duration')
// https://www.npmjs.org/package/pretty-bytes
const prettyBytes = require('pretty-bytes')

module.exports = function (opt) {
    return {
        getUsage: function (request, cb) {
            const health = {
              cpu_load: os.loadavg(),
              mem_free: os.freemem(),
              mem_free_percent: os.freemem() / os.totalmem(),
              mem_total: os.totalmem(),
              os_uptime: os.uptime()
          }
          if (!_.isUndefined(request.query.h)) {
              // make it human friendly
              health.mem_free_percent = health.mem_free_percent.toFixed(2) + '%'
              health.mem_free = prettyBytes(health.mem_free)
              health.mem_total = prettyBytes(health.mem_total)
              health.os_uptime = humanize((health.os_uptime * 1000), {
                  delimiter: ', ',
                  language: opt.lang
              })
          }
          cb({
              health: health
          })
        }
    }
}
