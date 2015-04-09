var fs = require('fs');
var Lab = require('lab');
var Joi = require('joi');
var pjson = require('../../package.json');
var schema = require('./schema');
var expect = Lab.expect;
var common = {
    /**
     * writeOutput writes the test output data to a json file
     * so we can observe what happened in the test and use the output
     * to validate expectations later
     *
     * @param name {string} The name of the test (used for filename)
     * @param body {object} JSON body to write
     * @param headers {object} optional headers
     */
    writeOutput: function(name, body, headers){
        fs.writeFile(
            'test/output/'+name+'.json',
            JSON.stringify(body, null, 2),
            function(err) {
                if(err){console.error('failed to write output file',err);}
            }
        );
        if(headers){
            headers.date = '[DYNAMIC]';
            fs.writeFile(
                'test/output/'+name+'.headers.json',
                JSON.stringify(headers, null, 2),
                function(err) {
                    if(err){console.error('failed to write headers output file',err);}
                }
            );
        }
    },
    shouldRegisterRoutes: function(server, done) {
        var table = server.table();
        expect(table).to.have.length(1);
        expect(table[0].path).to.equal('/service-status');
        done();
    },
    should500plainExplicit: function(name, server, done){
        server.inject({
            method: 'GET',
            url: '/service-status',
            headers: {
                accept: 'text/plain'
            }
        }, function(res) {
            common.writeOutput(name+'.should500plainExplicit.'+res.statusCode, res.result, res.headers);
            expect(res.statusCode).to.equal(500);
            expect(res.result).to.equal('FATAL');
            done();
        });
    },
    should500plainDefault: function(name, server, done){
        server.inject({
            method: 'GET',
            url: '/service-status'
        }, function(res) {
            common.writeOutput(name+'.should500plainDefault.'+res.statusCode, res.result, res.headers);
            expect(res.statusCode).to.equal(500);
            expect(res.result).to.equal('FATAL');

            done();
        });
    },
    shouldHead500: function(name, server, done){
        server.inject({
            method: 'HEAD',
            url: '/service-status'
        }, function(res) {
            common.writeOutput(name+'.shouldHead500.'+res.statusCode, res.result, res.headers);
            expect(res.statusCode).to.equal(500);
            done();
        });
    },
    should500Verbose: function(name, server, conf, done){
        server.inject({
            method: 'GET',
            url: '/service-status?v' + (conf.mech ? '' : '&h')
        }, function(res) {
            common.writeOutput(name+'.should500Verbose.'+res.statusCode, res.result, res.headers);
            expect(res.statusCode).to.equal(500);
            expect(res.result.service).to.be.instanceof(Object);
            expect(res.result.service.env).to.equal('FOO');
            expect(res.result.service.id).to.equal('1');
            expect(res.result.service.name).to.equal(pjson.name);
            expect(res.result.service.version).to.equal(pjson.version);

            Joi.validate(res.result,
                schema.createExpectedSchema(conf),
                function (err /*, value*/ ) {
                    expect(err).to.not.exist;
                    done();
                }
            );
        });
    }
};
module.exports = common;