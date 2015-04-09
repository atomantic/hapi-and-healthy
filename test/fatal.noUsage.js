var Lab = require('lab');
var Hapi = require('hapi');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var expect = Lab.expect;

var _ = require('../lib/_');
var common = require('./lib/common');
var pluginConfig = require('./lib/config');


var pluginConfigFatal = _.cloneDeep(pluginConfig);
pluginConfigFatal.options.test.node = [
    function(cb){
        return cb(true,'memcache is dead');
    },
    function(cb){
        return cb(null,'checksum good');
    }
];
pluginConfigFatal.options.usage = false;

describe('Hapi-and-Healthy plugin: FATAL state, no usage', function() {

    var server;

    before('start server', function(done){
        server = new Hapi.Server();
        done();
    });

    after('stop server', function(done){
        server.stop(done);
    });

    it('should load plugin succesfully', function(done){
        server.pack.register(pluginConfigFatal,
        function(err) {
            expect(err).to.equal(undefined);
            done();
        });
    });

    it('should register arbitrary routes', function(done){
        common.shouldRegisterRoutes(server, done);
    });

    it('should respond with 500 code and text/plain explicitly at non-verbose endpoint', function(done){
        common.should500plainExplicit('fatal.noUsage.3',server, done);
    });

    it('should respond with 500 code and text/plain by default at non-verbose endpoint', function(done){
        common.should500plainDefault('fatal.noUsage.4', server, done);
    });

    it('should respond with 500 code with HEAD request', function(done){
        common.shouldHead500('fatal.noUsage.5',server, done);
    });

    it('should respond with 500 code and expected schema at verbose endpoint', function(done){
        common.should500Verbose('fatal.noUsage.6', server, {mech:true,usage:true}, done);
    });
});
