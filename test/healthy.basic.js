var Code = require('code')
var Lab = require('@hapi/lab')
var Hapi = require('@hapi/hapi')
var lab = exports.lab = Lab.script()
var describe = lab.describe
var before = lab.before
var after = lab.after
var it = lab.it
var expect = Code.expect

var _ = require('lodash')
var common = require('./lib/common')

var pluginConfig = require('./lib/config')

var setName = _.last(__filename.split('/')).replace('.js', '')

describe('Hapi-and-Healthy plugin: ' + setName, function () {

    var testPluginConfig = _.cloneDeep(pluginConfig)

    var code = 200
    var state = testPluginConfig.options.state.good
    // Some day, I'll figure out how to DRY this out into a module
    // but for now, lab seems to require that these all exist directly in the describe
    // so a lot of copy/paste :(
    var server

    before(function () {
        server = new Hapi.Server({
            port: 3192
        })
    })

    after(function () {
        server.stop()
    })

    it('should load plugin succesfully', function () {
        server.register([testPluginConfig])
        .catch(err => expect(err).to.equal(undefined))
        .then(data => expect(data).to.equal(undefined))
    })

    it('should register arbitrary routes', function () {
        common.shouldRegisterRoutes(server)
    })

    it('should register arbitrary routes', function () {
        common.shouldRegisterRoutes(server)
    })

    it('should respond ' + code + ' code and text/plain explicitly at non-verbose endpoint', function () {
        common.shouldPlainExplicit(setName, server, code, state)
    })

    it('should respond ' + code + ' code and text/plain by default at non-verbose endpoint', function () {
        common.shouldPlainDefault(setName, server, code, state)
    })

    it('should respond ' + code + ' code with HEAD request', function () {
        common.shouldHead(setName, server, code, state)
    })

    it('should respond ' + code + ' code and expected output with verbose machine friendly', function () {
        common.shouldVerbose(setName, server, {
            human: false,
            usage: testPluginConfig.options.usage
        }, code, state)
    })

    it('should respond ' + code + ' code and expected output with verbose human friendly', function () {
        common.shouldVerbose(setName, server, {
            human: true,
            usage: testPluginConfig.options.usage
        }, code, state)
    })
})
