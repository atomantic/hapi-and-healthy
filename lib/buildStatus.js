var _ = require('lodash')

module.exports = function(opt) {
    if (opt.usage) {
        var systemStats = require('./systemStats')(opt)
    }
    return async function(request, h) {
        var etag,
            accept = request.headers.accept,
            type = opt.defaultContentType,
            plain = 'text/plain',
            json = 'application/json',
            match = request.headers['if-none-match'],
            verbose = !_.isUndefined(request.query.v),
            responseJSON = {
                service: {
                    status: {
                        message: [],
                        state: opt.state.good
                    }
                }
            },
            statusCode = 200
        if (verbose) {
            // force json
            type = json
        } else {
            if (!accept || accept.indexOf('*/*') !== -1) {
                type = opt.defaultContentType
            } else if (accept.indexOf(json) !== -1) {
                type = json
            } else if (accept.indexOf(plain) !== -1) {
                type = plain
            }
        }


        return Promise.all([
            // Node Tests (can result in FATAL)
            // if any one of our node tests fail, this node is bad
            // and should immediately be removed from rotation
            Promise.all(opt.test.node.map(test => test()))
                .then(data => responseJSON.service.status.message.push(data))
                .catch(err => {
                    responseJSON.service.status.message.push([err.message])
                    statusCode = 500
                    responseJSON.service.status.state = opt.state.bad
                }),
            // Feature Tests (can result in WARN)
            Promise.all(opt.test.features.map(test => test()))
                .then(data => responseJSON.service.status.message.push(data))
                .catch(err => {
                    responseJSON.service.status.message.push([err.message])
                    responseJSON.service.status.state = opt.state.warn
                })
        ]).then(function(data) {

            var body = responseJSON.service.status.state

            if (type !== plain) {
                type = 'application/json'
                body = responseJSON
                etag = new Buffer(JSON.stringify(body)).toString('base64')
                // now add published date
                body.service.status.published = new Date().toISOString()
            } else {
                etag = new Buffer((body)).toString('base64')
            }

            // support for If-None-Match: {etag}
            if (match && match === etag) {
                return h.code(304)
            }

            if (!verbose) {
                return h.response(body).code(statusCode).type(type).etag(etag)
            }

            let usageData = opt.usage ? systemStats.getUsage(request) : {}
            responseJSON = _.merge(responseJSON, {
                service: {
                    custom: _.merge(usageData, opt.custom),
                    env: opt.env,
                    id: opt.id,
                    name: opt.name,
                    // service-status schema version
                    schema: opt.schema || '1.1.0',
                    version: opt.version
                }
            })
            // only add versioned paths if supplied in config
            if (opt.paths) {
                responseJSON.service.paths = opt.paths
            }
            return h.response(responseJSON).code(statusCode).type(type).etag(etag)
        })
    }
}
