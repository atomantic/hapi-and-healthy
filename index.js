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
// https://www.npmjs.org/package/async
var async = require('async');
// https://www.npmjs.org/package/git-rev
var git = require('git-rev');

exports.register = function (plugin, options, next) {

    // configuration options
    var opt = _.merge({
            id: 'git',
            lang: 'en',
            test:{
                node:[function(cb){cb(false,'all good');}]
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
            var etag,
                type = 'text/plain', // default response type
                plain = request.headers.accept===type, // wants text/plain
                match = request.headers['if-none-match'],
                json = {
                  service: {
                    status: {
                    }
                  }
                };
            // if any one of our node tests fail, this node is bad
            // and should immediately be removed from rotation
            // run tests in parallel async
            async.parallel(opt.test.node, function(err, data){
                // if any of the tests return an err, it will show up here immediately
                var state = err ? opt.state.bad : opt.state.good;
                // we are only going to return 200/500
                var code = err ? 500 : 200;
                var body = state;
                if(!plain){
                    json.service.status.message = data;
                    json.service.status.state = state;
                    type = 'application/json';
                    body = json;
                    etag = _.base64_encode(body);
                    // now add published date
                    body.service.status.published = _.isotime();
                }else{
                    etag = _.base64_encode(body);
                }

                // support for If-None-Match: {etag}
                if(match && match===etag){
                    return reply().code(304);
                }

                if(_.isUndefined(request.query.v)){
                    return reply(body).code(code).type(type).etag(etag);
                }
                // we want more info
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
                            custom: data,
                            id: opt.id,
                            name: opt.name,
                            version: opt.version
                        }
                    });
                    if(json.service.id==='git'){
                        // set it to the git commit hash
                        git.long(function(str){
                            json.service.id = str;
                            return reply(json).etag(etag);
                        });
                    }else{
                        return reply(json).etag(etag);
                    }
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
                // cache:{
                //     expiresIn: 86400000,
                //     privacy: 'public'
                // },
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