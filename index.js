'use strict'

const _ = require('./lib/_')
const config = require('./lib/config')

module.exports = {
    pkg: require('./package.json'),
    register: async function (server, opts) {
        // merge custom options over default config
        const opt = _.merge(config, opts)
    
        // allow custom objects to be passed by reference
        // lest _.merge copy the data at time of passing it
        opt.custom = opts.custom || {}
    
        server.route(require('./lib/route')(opt))
    }
}
