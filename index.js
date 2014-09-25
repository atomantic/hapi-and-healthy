// http://lodash.com/
var _ = require('lodash');
// https://github.com/atomantic/undermore
//mixin(require('undermore'));
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
            id: ''
            lang: 'en',
            test:{
                ltm:[]
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
        replyStatus = function(request, reply, data){
            if(request.headers.accept==='text/plain'){
                reply(data).type('text/plain').header('connection','close');
            }else{
                // json
            }
        },
        buildStatus = function(request, reply){
            var output = {
                  service: {
                    id: opt.id,
                    name: opt.name,
                    version: opt.version,
                    custom: {},
                    status: {
                      state: "GOOD",
                      message: "all clear",
                      published: "2014-09-24T03:27:59.575Z"
                    }
                  }
                }
            // if any one of our LTM tests fail, this node is bad
            // and should immediately be removed from rotation
            if(opt.test.ltm.length){
                // run ltm tests async in parallel
                async.parallel(opt.test.ltm, function(err, data){
                    if(err){
                        reply(opt.state.bad).code(500).type('text/plain').header('connection','close');
                    }
                });
            }
            if(request.query.v){
                getHealth(request, function(data){

                    data.health.cpu_proc = _.isNumber(data.health.cpu_proc) ? data.health.cpu_proc.toFixed(2)+'%' : data.health.cpu_proc;
                    data.health.mem_proc = _.isNumber(data.health.mem_proc) ? data.health.mem_proc.toFixed(2)+'%' : data.health.mem_proc;
                    data.health.mem_free_percent = data.health.mem_free_percent.toFixed(2)+'%';

                    data.health.mem_free = prettyBytes(data.health.mem_free);
                    data.health.mem_total = prettyBytes(data.health.mem_total);

                    data.health.os_uptime = humanize(data.health.os_uptime,{
                       delimiter:', ',
                       language:opt.lang
                    });

                    reply(data);
                });
            }
            
            // tests pass then we are peachy:
            reply(opt.state.good).type('text/plain').header('connection','close');
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