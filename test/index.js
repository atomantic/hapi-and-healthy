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

describe('Hapi-and-Healthy plugin', function() {

    var server = new Hapi.Server();

    var schemaFull = Joi.object().keys({
        cpu_load: Joi.array().length(3).includes(Joi.number()).required(),
        cpu_proc: Joi.number().min(0).max(101).required(),
        mem_free: Joi.number().integer().required(),
        mem_free_percent: Joi.number().min(0).max(1).required(),
        mem_proc: Joi.number().min(0).max(1).required(),
        mem_total: Joi.number().integer().required(),
        os_uptime: Joi.number().required()
    });
    var schemaHuman = Joi.object().keys({
        cpu_load: Joi.array().length(3).includes(Joi.number()).required(),
        cpu_proc: Joi.string().required(),
        mem_free: Joi.string().required(),
        mem_free_percent: Joi.string().required(),
        mem_proc: Joi.string().required(),
        mem_total: Joi.string().required(),
        os_uptime: Joi.string().required()
    });

    it('should load plugin succesfully', function(done){
        server.pack.register({
            plugin: require('../'),
            options: {
                ltm:{
                    test:[]
                },
                path:{
                    ltm: '/service-status',
                    main: '/service-status/full',
                    human: '/service-status/human'
                },
                state:{
                    good: "HEALTHY",
                    bad: "FATAL",
                    warn: "WARN"
                }
            }
        },
        function(err) {
            expect(err).to.equal(undefined);
            done();
        });
    });
 
    it('should register arbitrary routes', function(done) {
        var table = server.table();

        expect(table).to.have.length(4);
        expect(table[0].path).to.equal('/service-status');
        expect(table[1].path).to.equal('/service-status/full');
        expect(table[2].path).to.equal('/service-status/human');
        expect(table[3].path).to.equal('/service-status');

        done();
    });

    it('should respond with 200 code and arbitrary text at LTM monitor endpoint',function(done){
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


    it('should respond with 200 code and expected schema at full endpoint',function(done){
        server.inject({
            method: "GET",
            url: "/service-status/full"
        }, function(response) {

            var health = response.result.health;
            expect(response.statusCode).to.equal(200);

            Joi.validate(health, schemaFull, function (err, value) {
                expect(err).to.equal(null);
                //console.log(value);
                done();
            });

        });
    });


    it('should respond with 200 code and expected schema at human endpoint',function(done){
        server.inject({
            method: "GET",
            url: "/service-status/human"
        }, function(response) {

            var health = response.result.health;
            expect(response.statusCode).to.equal(200);

            Joi.validate(health, schemaHuman, function (err, value) {
                expect(err).to.equal(null);
                done();
            });

        });
    });

});
