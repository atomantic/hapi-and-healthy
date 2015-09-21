var Code = require('code');
var Lab = require('lab');
var Hapi = require('hapi');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var before = lab.before;
var after = lab.after;
var it = lab.it;
var expect = Code.expect;

var _ = require('../lib/_');
var common = require('./lib/common');
var pluginConfig = require('./lib/config');

var setName = _.last(__filename.split('/')).replace('.js', '');

describe('Hapi-and-Healthy plugin: ' + setName, function() {

    var testPluginConfig = _.cloneDeep(pluginConfig);
    testPluginConfig.options.test.node = [
        function(cb){
            return cb(true, 'memcache is dead');
        },
        function(cb){
            return cb(null, 'checksum good');
        }
    ];

    var code = 500;
    var state = testPluginConfig.options.state.bad;


    // Some day, I'll figure out how to DRY this out into a module
    // but for now, lab seems to require that these all exist directly in the describe
    // so a lot of copy/paste :(
    var server;

    before('start server', function(done){
        server = new Hapi.Server();
        server.connection({
            port: 3192
        });

        done();
    });

    after('stop server', function(done){
        server.stop(done);
    });

    it('should load plugin succesfully', function(done){
        server.register(testPluginConfig,
        function(err) {
            expect(err).to.equal(undefined);
            done();
        });
    });

    it('should register arbitrary routes', function(done){
        common.shouldRegisterRoutes(server, done);
    });

    it('should respond ' + code + ' code and text/plain explicitly at non-verbose endpoint', function(done){
        common.shouldPlainExplicit(setName, server, code, state, done);
    });

    it('should respond ' + code + ' code and text/plain by default at non-verbose endpoint', function(done){
        common.shouldPlainDefault(setName, server, code, state, done);
    });

    it('should respond ' + code + ' code with HEAD request', function(done){
        common.shouldHead(setName, server, code, state, done);
    });

    it('should respond ' + code + ' code and expected output with verbose machine friendly', function(done){
        common.shouldVerbose(setName, server, {
            human: false,
            usage: testPluginConfig.options.usage
        }, code, state, done);
    });

    it('should respond ' + code + ' code and expected output with verbose human friendly', function(done){
        common.shouldVerbose(setName, server, {
            human: true,
            usage: testPluginConfig.options.usage
        }, code, state, done);
    });
});
