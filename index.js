// http://lodash.com/
var _ = require('lodash');
// https://github.com/atomantic/undermore
_.mixin(require('undermore'));
_.mixin({
    isotime:function(){
        return (new Date()).toISOString();
    }
});
// http://nodejs.org/api/os.html
var os = require('os');
// https://www.npmjs.org/package/usage
var usage = require('usage');
// https://www.npmjs.org/package/humanize-duration
var humanize = require("humanize-duration");
// https://www.npmjs.org/package/pretty-bytes
var prettyBytes = require("pretty-bytes");
var async = require('async');

exports.register = function (plugin, options, next) {

    // configuration options
    var opt = _.merge({
            id: '',
            lang: 'en',
            test:{
                ltm:[function(cb){cb(false,'all good');}]
            },
            name: 'my_service',
            path: '/health',
            state:{
                good: 'GOOD',
                bad: 'BAD',
                warn: 'WARN'
            },
            version: '0.0.0'
        }, options );

    var getHealth = function(request, cb){
            usage.lookup(process.pid, function(err, usage) {
               cb({
                   health:{
                       cpu_load: os.loadavg(),
                       cpu_proc: err || usage.cpu,
                       mem_free: os.freemem(),
                       mem_free_percent: os.freemem()/os.totalmem(),
                       mem_proc: err || usage.memory/os.totalmem(),
                       mem_total: os.totalmem(),
                       os_uptime: os.uptime()
                   }
               });
            });
        },
        buildStatus = function(request, reply){
            var plain = request.headers.accept==='text/plain',
                json = {
                  service: {
                    status: {
                      state: opt.state.good,
                      message: '',
                      published: _.isotime()
                    }
                  }
                };

            // if any one of our LTM tests fail, this node is bad
            // and should immediately be removed from rotation
            // run ltm tests async in parallel
            async.parallel(opt.test.ltm, function(err, data){
                json.service.status.message = data;
                json.service.status.state = err ? opt.state.bad : opt.state.good;
                var code = err ? 500 : 200;
                var type = plain ? 'text/plain' : 'application/json';
                var body = plain ? json.service.status.state : json;

                if(_.isUndefined(request.query.v)){
                    return reply(body).code(code).type(type).header('connection','close');
                }
                getHealth(request, function(data){
                    if(!_.isUndefined(request.query.h)){
                        // make it human friendly
                        data.health.cpu_proc = _.isNumber(data.health.cpu_proc) ? data.health.cpu_proc.toFixed(2)+'%' : data.health.cpu_proc;
                        data.health.mem_proc = _.isNumber(data.health.mem_proc) ? data.health.mem_proc.toFixed(2)+'%' : data.health.mem_proc;
                        data.health.mem_free_percent = data.health.mem_free_percent.toFixed(2)+'%';

                        data.health.mem_free = prettyBytes(data.health.mem_free);
                        data.health.mem_total = prettyBytes(data.health.mem_total);

                        data.health.os_uptime = humanize(data.health.os_uptime,{
                           delimiter:', ',
                           language:opt.lang
                        });
                    }
                    json = _.merge(json, {
                        service: {
                            id: opt.id,
                            name: opt.name,
                            version: opt.version,
                            custom: data
                        }
                    });

                    return reply(json);
                });
            });
        };

    // create an endpoint for each server
    plugin.servers.forEach(function (server) {

        plugin.route({
            method: 'GET',
            path: opt.path,
            config:{
                auth:false,
                tags:['api','health','status'],
                description: "Simple LTM monitor API to determine if the node is bad. Responds with text/plain and 200 or 500 code.",
                notes: "Returns a web service's current health status state. Status State String: HEALTHY, WARN, FATAL. WARN is a (graceful) degraded state - service only provides core, required functionality when in this state. If LTM detects non-200 response or FATAL, node should be pulled from rotation immediately."
            },
            handler: buildStatus
        });
        plugin.route({
            method: 'HEAD',
            path: opt.path,
            config:{
                auth:false,
                tags:['api','health','status'],
                description: "Simple HEAD check API to determine if the node is bad. Responds only with 200 or 500 HTTP response code.",
                notes: "Retrieve a web service's health status simply via HTTP response code."
            },
            handler: buildStatus
        });

    });

    next();

};

// plugin name, etc:
exports.register.attributes = {
    pkg: require("./package.json")
};