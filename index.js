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

exports.register = function (plugin, options, next) {

    // configuration options
    var opt = _.merge({
            lang: "en",
            ltm:{
                test:[]
            },
            path: {
                main: '/health',
                ltm: '/health/ltm',
                human: '/health/human'
            },
            state:{
                good: "GOOD",
                bad: "BAD",
                warn: "WARN"
            }
        }, options );

    var getHealth = function(cb){
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
    };

    // create an endpoint for each server
    plugin.servers.forEach(function (server) {

        // main API
        plugin.route({
            method: 'GET',
            path: opt.path.main,
            config: {
                auth: opt.auth||false
            },
            handler: function(request, reply) {
                getHealth(reply);
            }
        });

        // Human API
        plugin.route({
            method: 'GET',
            path: opt.path.human,
            config: {
                auth: opt.auth||false
            },
            handler: function(request, reply) {
                getHealth(function(data){

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
        });

        // Local Traffic Manager (LTM) monitoring
        // only cares if the node health is good or bad
        // (should it be pulled from the pool or pushed back in?)
        plugin.route({
            method: 'GET',
            path: opt.path.ltm,
            config:{
                auth:false,
                tags:['api','health','status'],
                description: "Simple LTM monitor API to determine if the node is bad. Responds with text/plain and 200 or 500 code.",
                notes: "if an LTM monitor sees that a node's LTM health API returns a 500 code, the node should be immediately pulled from rotation."
            },
            handler: function(request,reply){
                // if any one of our LTM tests fail, this node is bad
                // and should immediately be removed from rotation
                _.each(opt.ltm.test, function(fn){
                    if(!fn()){
                        reply(opt.state.bad).code(500).type('text/plain');
                    }
                });
                // tests pass then we are peachy:
                reply(opt.state.good).type('text/plain');
            }
        });

    });

    next();

};

// plugin name, etc:
exports.register.attributes = {
    pkg: require("./package.json")
};