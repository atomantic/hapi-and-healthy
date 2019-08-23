var fs = require('fs')
var Code = require('code')
var expect = Code.expect
var Joi = require('@hapi/joi')
var pjson = require('../../package.json')
var schema = require('./schema')
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
    writeOutput: function (name, body, headers) {
        fs.writeFile(
            'test/output/' + name + '.json',
            JSON.stringify(body, null, 2),
            function (err) {
                if (err) {
                    console.error('failed to write output file', err)
                }
            }
        )
        if (headers) {
            headers.date = '[DYNAMIC]'
            fs.writeFile(
                'test/output/' + name + '.headers.json',
                JSON.stringify(headers, null, 2),
                function (err) {
                    if (err) {
                        console.error('failed to write headers output file', err)
                    }
                }
            )
        }
    },
    shouldRegisterRoutes: function (server) {
        var table = server.table()
        expect(table).to.have.length(1)
        expect(table[0].path).to.equal('/service-status')
    },
    shouldPlainExplicit: function (name, server, code, state) {
        server.inject({
            method: 'GET',
            url: '/service-status',
            headers: {
                accept: 'text/plain'
            }
        }, function (res) {
            common.writeOutput(name + '.shouldPlainExplicit.' + res.statusCode, res.result, res.headers)
            expect(res.statusCode).to.equal(code)
            expect(res.result).to.equal(state)
        })
    },
    shouldPlainDefault: function (name, server, code, state) {
        server.inject({
            method: 'GET',
            url: '/service-status'
        }, function (res) {
            common.writeOutput(name + '.shouldPlainDefault.' + res.statusCode, res.result, res.headers)
            expect(res.statusCode).to.equal(code)
            expect(res.result).to.equal(state)
        })
    },
    shouldHead: function (name, server, code, state) {
        server.inject({
            method: 'HEAD',
            url: '/service-status'
        }, function (res) {
            common.writeOutput(name + '.shouldHead.' + res.statusCode, res.result, res.headers)
            expect(res.statusCode).to.equal(code)
            expect(res.result).to.be.null()
        })
    },
    shouldVerbose: function (name, server, conf, code, state) {
        server.inject({
            method: 'GET',
            url: '/service-status?v' + (conf.human ? '&h' : '')
        }, function (res) {
            var filename = name + '.shouldVerbose'
            if (conf.human) {
                filename += '.human'
            }
            if (conf.usage) {
                filename += '.usage'
            }
            //console.log(name, 'verbose', conf, filename)
            common.writeOutput(filename + '.' + res.statusCode, res.result, res.headers)
            expect(res.statusCode).to.equal(code)
            expect(res.result.service).to.be.instanceof(Object)
            expect(res.result.service.env).to.equal('FOO')
            expect(res.result.service.id).to.equal('1')
            expect(res.result.service.name).to.equal(pjson.name)
            expect(res.result.service.version).to.equal(pjson.version)
            expect(res.result.service.status.state).to.equal(state)

            Joi.validate(res.result,
                schema.createExpectedSchema(conf),
                function (err /*, value*/ ) {
                    expect(err).to.not.exist()
                }
            )
        })
    }
}
module.exports = common
