// http://lodash.com/
var _ = require('lodash');
// https://github.com/atomantic/undermore
_.mixin(require('undermore'));
_.mixin({
    isotime:function(){
        return (new Date()).toISOString();
    }
});
// https://www.npmjs.org/package/async
var async = require('async');
// https://www.npmjs.org/package/git-rev
var git = require('git-rev');

exports.register = function (plugin, options, next) {

    // configuration options
    var opt = _.merge({
            custom: {},
            env: 'DEV',
            id: 'git',
            lang: 'en',
            test:{
                node:[function(cb){cb(false,'all good');}]
            },
            defaultContentType: 'text/plain',
            name: 'my_service',
            path: '/service-status',
            state:{
                good: 'GOOD',
                bad: 'BAD',
                warn: 'WARN'
            },
            usage: true,
            usage_proc: true,
            version: '0.0.0'
        }, options );

    if(opt.usage){
        // http://nodejs.org/api/os.html
        var os = require('os');

        if(opt.usage_proc){
            // https://www.npmjs.org/package/usage
            var usage = require('usage');
        }
        // https://www.npmjs.org/package/humanize-duration
        var humanize = require("humanize-duration");
        // https://www.npmjs.org/package/pretty-bytes
        var prettyBytes = require("pretty-bytes");
    }

    var getUsage = function(request, cb){
            var returnUsage = function(err, usage) {
                if(err) console.error(err);

                var health = {
                    cpu_load: os.loadavg(),
                    mem_free: os.freemem(),
                    mem_free_percent: os.freemem()/os.totalmem(),
                    mem_total: os.totalmem(),
                    os_uptime: os.uptime()
                };
                if(usage){
                    health.cpu_proc = err || usage.cpu;
                    health.mem_proc = err || usage.memory/os.totalmem();
                }
                if(!_.isUndefined(request.query.h)){
                    // make it human friendly
                    if(usage && _.isNumber(health.cpu_proc))
                        health.cpu_proc = health.cpu_proc.toFixed(2)+'%';
                    if(usage && _.isNumber(health.mem_proc))
                        health.mem_proc = health.mem_proc.toFixed(2)+'%';

                    health.mem_free_percent = health.mem_free_percent.toFixed(2)+'%';
                    health.mem_free = prettyBytes(health.mem_free);
                    health.mem_total = prettyBytes(health.mem_total);
                    health.os_uptime = humanize((health.os_uptime*1000),{
                       delimiter:', ',
                       language:opt.lang
                    });
                }
                cb({
                   health: health
                });
            }
            if(opt.usage_proc){
                // query the process usage
                usage.lookup(process.pid, returnUsage);
            }else{
                // just use OS usage
                returnUsage();
            }
        },
        buildStatus = function(request, reply){
            var etag,
                accept = request.headers.accept,
                type = opt.defaultContentType,
                plain = 'text/plain',
                json = 'application/json',
                match = request.headers['if-none-match'],
                verbose = !_.isUndefined(request.query.v),
                responseJSON = {
                  service: {
                    status: {
                    }
                  }
                };
            if(verbose){
                // force json
                type = json;
            }else{
                if(!accept || accept.indexOf('*/*')!==-1){
                    type = opt.defaultContentType;
                }else if(accept.indexOf(json)!==-1){
                    type = json;
                }else if(accept.indexOf(plain)!==-1){
                    type = plain;
                }
            }

            // if any one of our node tests fail, this node is bad
            // and should immediately be removed from rotation
            // run tests in parallel async
            async.parallel(opt.test.node, function(err, data){
                // if any of the tests return an err, it will show up here immediately
                var state = err ? opt.state.bad : opt.state.good;
                // we are only going to return 200/500
                var code = err ? 500 : 200;
                var body = state;

                if(type!==plain){
                    responseJSON.service.status.message = data;
                    responseJSON.service.status.state = state;
                    type = 'application/json';
                    body = responseJSON;
                    etag = _.base64_encode(JSON.stringify(body));
                    // now add published date
                    body.service.status.published = _.isotime();
                }else{
                    etag = _.base64_encode(body);
                }

                // support for If-None-Match: {etag}
                if(match && match===etag){
                    return reply().code(304);
                }

                if(!verbose){
                    return reply(body).code(code).type(type).etag(etag);
                }
                var fulfill = function(data){
                    responseJSON = _.merge(responseJSON, {
                        service: {
                            custom: _.merge(data||{}, opt.custom),
                            env: opt.env,
                            id: opt.id,
                            name: opt.name,
                            version: opt.version
                        }
                    });
                    if(responseJSON.service.id==='git'){
                        // set it to the git commit hash
                        git.long(function(str){
                            responseJSON.service.id = str;
                            return reply(responseJSON).etag(etag);
                        });
                    }else{
                        return reply(responseJSON).etag(etag);
                    }
                };
                // we want more info
                if(opt.usage){
                    getUsage(request, fulfill);
                }else{
                    fulfill();
                }
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