var Lab = require('lab');
var Hapi = require('hapi');
var Joi = require('joi');

// test shortcuts
var lab = exports.lab = Lab.script();
var before = lab.before;
var after = lab.after;
var describe = lab.describe;
var it = lab.it;
// lab.expect uses chai: http://chaijs.com/
var expect = Lab.expect;
var pjson = require('../package.json');

describe('Hapi-and-Healthy plugin', function() {

    var server = new Hapi.Server();
    var schemaStatus = Joi.object().keys({
        state: Joi.string(),
        message: Joi.array(),
        published: Joi.string()
    });
    var schemaBasic = Joi.object().keys({
        service: Joi.object().keys({
            status: schemaStatus
        })
    });
    var schemaFull = Joi.object().keys({
        service: Joi.object().keys({
            env: Joi.string(),
            id: Joi.string(),
            custom: Joi.object().keys({
                health:{
                    cpu_load: Joi.array().length(3).includes(Joi.number()).required(),
                    cpu_proc: Joi.number().min(0).max(101).required(),
                    mem_free: Joi.number().integer().required(),
                    mem_free_percent: Joi.number().min(0).max(1).required(),
                    mem_proc: Joi.number().min(0).max(1).required(),
                    mem_total: Joi.number().integer().required(),
                    os_uptime: Joi.number().required()
                }
            }),
            name: Joi.string(),
            status: schemaStatus,
            version: Joi.string()
        })
    });
    var schemaHuman = Joi.object().keys({
        service: Joi.object().keys({
            env: Joi.string(),
            id: Joi.string(),
            custom: Joi.object().keys({
                health:{
                    cpu_load: Joi.array().length(3).includes(Joi.number()).required(),
                    cpu_proc: Joi.string().required(),
                    mem_free: Joi.string().required(),
                    mem_free_percent: Joi.string().required(),
                    mem_proc: Joi.string().required(),
                    mem_total: Joi.string().required(),
                    os_uptime: Joi.string().required()
                }
            }),
            name: Joi.string(),
            status: schemaStatus,
            version: Joi.string()
        })
    });

    it('should load plugin succesfully', function(done){
        server.pack.register({
            plugin: require('../'),
            options: {
                env: "FOO",
                id: '1',
                name: pjson.name,
                test:{
                    node:[function(cb){
                        return cb(null,'memcache all good');
                    },function(cb){
                        return cb(null,'checksum good');
                    }]
                },
                path: '/service-status',
                state:{
                    good: "HEALTHY",
                    bad: "FATAL",
                    warn: "WARN"
                },
                version: pjson.version
            }
        },
        function(err) {
            expect(err).to.equal(undefined);
            done();
        });
    });

    it('should register arbitrary routes', function(done) {
        var table = server.table();

        expect(table).to.have.length(2);
        expect(table[0].path).to.equal('/service-status');
        expect(table[1].path).to.equal('/service-status');

        done();
    });

    it('should respond with 200 code and plaintext at non-verbose endpoint',function(done){
        server.inject({
            method: "GET",
            url: "/service-status",
            headers: {
                accept: 'text/plain'
            }
        }, function(response) {
            expect(response.statusCode).to.equal(200);
            expect(response.result).to.equal('HEALTHY');

            done();
        });
    });

    it('should respond with 200 code and text/plain at non-verbose endpoint',function(done){
        server.inject({
            method: "GET",
            url: "/service-status"
        }, function(response) {
            expect(response.statusCode).to.equal(200);
            expect(response.result).to.equal('HEALTHY');
            done();
        });
    });

    it('should respond with 200 code with HEAD request',function(done){
        server.inject({
            method: "HEAD",
            url: "/service-status"
        }, function(response) {
            expect(response.statusCode).to.equal(200);
            done();
        });
    });


    it('should respond with 200 code and expected schema at verbose endpoint',function(done){
        server.inject({
            method: "GET",
            url: "/service-status?v"
        }, function(response) {

            expect(response.statusCode).to.equal(200);
            expect(response.result.service).to.be.instanceof(Object);
            expect(response.result.service.env).to.equal('FOO');
            expect(response.result.service.id).to.equal('1');
            expect(response.result.service.name).to.equal(pjson.name);
            expect(response.result.service.version).to.equal(pjson.version);

            Joi.validate(response.result, schemaFull, function (err, value) {
                expect(err).to.not.exist;
                done();
            });

        });
    });


    it('should respond with 200 code and expected schema at human endpoint',function(done){
        server.inject({
            method: "GET",
            url: "/service-status?v&h"
        }, function(response) {

            expect(response.statusCode).to.equal(200);
            expect(response.result.service).to.be.instanceof(Object);
            expect(response.result.service.env).to.equal('FOO');
            expect(response.result.service.id).to.equal('1');
            expect(response.result.service.name).to.equal(pjson.name);
            expect(response.result.service.version).to.equal(pjson.version);

            Joi.validate(response.result, schemaHuman, function (err, value) {
                expect(err).to.not.exist;
                done();
            });

        });
    });

});
