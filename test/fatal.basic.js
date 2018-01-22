const Code = require('code')
const Lab = require('lab')
const Hapi = require('hapi')
const lab = exports.lab = Lab.script()
const describe = lab.describe
const before = lab.before
const after = lab.after
const it = lab.it
const expect = Code.expect

const _ = require('lodash')
const common = require('./lib/common')
const pluginConfig = require('./lib/config')

const setName = _.last(__filename.split('/')).replace('.js', '')

describe('Hapi-and-Healthy plugin: ' + setName, function() {

    const testPluginConfig = _.cloneDeep(pluginConfig)
    testPluginConfig.options.test.node = [
        function(cb){
            return cb(true, 'memcache is dead')
        },
        function(cb){
            return cb(null, 'checksum good')
        }
    ]

    const code = 500
    const state = testPluginConfig.options.state.bad


    // Some day, I'll figure out how to DRY this out into a module
    // but for now, lab seems to require that these all exist directly in the describe
    // so a lot of copy/paste :(
    var server

    before(function(){
        server = new Hapi.Server({
            port: 3192
        })
    })

    after(function(){
        server.stop()
    })

    it('should load plugin succesfully', function(){
        server.register([testPluginConfig])
        .catch(err => expect(err).to.equal(undefined))
        .then(data => expect(data).to.equal(undefined))
    })

    it('should register arbitrary routes', function(){
        common.shouldRegisterRoutes(server)
    })

    it('should respond ' + code + ' code and text/plain explicitly at non-verbose endpoint', function(){
        common.shouldPlainExplicit(setName, server, code, state)
    })

    it('should respond ' + code + ' code and text/plain by default at non-verbose endpoint', function(){
        common.shouldPlainDefault(setName, server, code, state)
    })

    it('should respond ' + code + ' code with HEAD request', function(){
        common.shouldHead(setName, server, code, state)
    })

    it('should respond ' + code + ' code and expected output with verbose machine friendly', function(){
        common.shouldVerbose(setName, server, {
            human: false,
            usage: testPluginConfig.options.usage
        }, code, state)
    })

    it('should respond ' + code + ' code and expected output with verbose human friendly', function(){
        common.shouldVerbose(setName, server, {
            human: true,
            usage: testPluginConfig.options.usage
        }, code, state)
    })
})
