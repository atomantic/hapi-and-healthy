var _ = require('./_');
// http://nodejs.org/api/os.html
var os = require('os');
// https://www.npmjs.org/package/humanize-duration
var humanize = require('humanize-duration');
// https://www.npmjs.org/package/pretty-bytes
var prettyBytes = require('pretty-bytes');

module.exports = function (opt) {
    if (opt.usage_proc) {
        // https://www.npmjs.org/package/usage
        var usage = require('usage');
    }
    return {
        getUsage: function (request, cb) {
            var returnUsage = function (err, u) {
                if (err) {
                    console.error('error', err);
                }

                var health = {
                    cpu_load: os.loadavg(),
                    mem_free: os.freemem(),
                    mem_free_percent: os.freemem() / os.totalmem(),
                    mem_total: os.totalmem(),
                    os_uptime: os.uptime()
                };
                if (u) {
                    health.cpu_proc = err || u.cpu;
                    health.mem_proc = err || u.memory / os.totalmem();
                }
                if (!_.isUndefined(request.query.h)) {
                    // make it human friendly
                    if (u && _.isNumber(health.cpu_proc)){
                        health.cpu_proc = health.cpu_proc.toFixed(2) + '%';
                    }
                    if (u && _.isNumber(health.mem_proc)){
                        health.mem_proc = health.mem_proc.toFixed(2) + '%';
                    }

                    health.mem_free_percent = health.mem_free_percent.toFixed(2) + '%';
                    health.mem_free = prettyBytes(health.mem_free);
                    health.mem_total = prettyBytes(health.mem_total);
                    health.os_uptime = humanize((health.os_uptime * 1000), {
                        delimiter: ', ',
                        language: opt.lang
                    });
                }
                cb({
                    health: health
                });
            };
            if (opt.usage_proc) {
                // query the process usage
                usage.lookup(process.pid, returnUsage);
            } else {
                // just use OS usage
                returnUsage();
            }
        }
    };
};
