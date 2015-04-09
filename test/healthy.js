var Lab = require('lab');
var Hapi = require('hapi');
var Joi = require('joi');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Lab.expect;

var common = require('./lib/common');
var pjson = require('../package.json');
var pluginConfig = require('./lib/config');
var schema = require('./lib/schema');

describe('Hapi-and-Healthy plugin: HEALTHY state', function() {
    return;
    var server = new Hapi.Server();

    var shouldRegisterRoutes = function(done) {
        var table = server.table();

        expect(table).to.have.length(1);
        expect(table[0].path).to.equal('/service-status');

        done();
    };
    var should200plainExplicit = function(done){
        server.inject({
            method: 'GET',
            url: '/service-status',
            headers: {
                accept: 'text/plain'
            }
        }, function(response) {
            expect(response.statusCode).to.equal(200);
            expect(response.result).to.equal('HEALTHY');

            done();
        });
    };

    var should200plainDefault = function(done){
        server.inject({
            method: 'GET',
            url: '/service-status'
        }, function(response) {
            expect(response.statusCode).to.equal(200);
            expect(response.result).to.equal('HEALTHY');

            done();
        });
    };

    var shouldHead200 = function(done){
        server.inject({
            method: 'HEAD',
            url: '/service-status'
        }, function(response) {
            expect(response.statusCode).to.equal(200);
            done();
        });
    };

    var should200Verbose = function(conf){

        return function(done){
            server.inject({
                method: 'GET',
                url: '/service-status?v' + (conf.mech ? '' : '&h')
            }, function(response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result.service).to.be.instanceof(Object);
                expect(response.result.service.env).to.equal('FOO');
                expect(response.result.service.id).to.equal('1');
                expect(response.result.service.name).to.equal(pjson.name);
                expect(response.result.service.version).to.equal(pjson.version);

                Joi.validate(response.result,
                    schema.createExpectedSchema(conf),
                    function (err /*, value*/ ) {
                        expect(err).to.not.exist;
                        done();
                    }
                );

            });
        };
    };

    describe('Basic Configuration (Defaults)', function() {

        it('should load plugin succesfully', function(done){
            server.pack.register(pluginConfig,
            function(err) {
                expect(err).to.equal(undefined);
                done();
            });
        });

        it('should register arbitrary routes', shouldRegisterRoutes);

        it('should respond with 200 code and text/plain explicitly at non-verbose endpoint', should200plainExplicit);

        it('should respond with 200 code and text/plain by default at non-verbose endpoint', should200plainDefault);

        it('should respond with 200 code with HEAD request', shouldHead200);

        it('should respond with 200 code and expected schema at verbose endpoint', should200Verbose({mech:true,usage:true}));

        it('should respond with 200 code and expected schema at human endpoint', should200Verbose({mech:false,usage:true}));
    });

    describe('Restricted Configuration', function() {

        it('should load restricted plugin succesfully', function(done){

            server.stop(function () {
                server = new Hapi.Server();

                // remove usage data
                pluginConfig.options.usage = false;
                server.pack.register(pluginConfig,
                function(err) {
                    expect(err).to.equal(undefined);
                    done();
                });
            });
        });

        it('should register arbitrary routes', shouldRegisterRoutes);

        it('should respond with 200 code and text/plain explicitly at non-verbose endpoint', should200plainExplicit);

        it('should respond with 200 code and text/plain by default at non-verbose endpoint', should200plainDefault);

        it('should respond with 200 code with HEAD request', shouldHead200);

        it('should respond with 200 code and expected schema at verbose endpoint', should200Verbose({mech:true,usage:false}));

        it('should respond with 200 code and expected schema at human endpoint', should200Verbose({mech:false,usage:false}));
    });

});
