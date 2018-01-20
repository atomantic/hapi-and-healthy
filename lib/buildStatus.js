var _ = require('lodash')
// https://www.npmjs.org/package/git-rev-sync
const git = require('git-rev-sync')

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
            Promise.all(opt.test.node)
                .then(data => responseJSON.service.status.message.push(data))
                .catch(err => { 
                    statusCode = 500
                    responseJSON.service.status.state = opt.state.bad
                }),
            // Feature Tests (can result in WARN)
            Promise.all(opt.test.features)
                .then(data => responseJSON.service.status.message.push(data))
                .catch(err => { 
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
            var fulfill = function(fulfilledData) {
                responseJSON = _.merge(responseJSON, {
                    service: {
                        custom: _.merge(fulfilledData || {}, opt.custom),
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
                if (responseJSON.service.id === 'git') {
                    // set it to the git commit hash
                    responseJSON.service.id = git.long()
                }
                return h.response(responseJSON).code(statusCode).type(type).etag(etag)
            }
            fulfill(opt.usage ? systemStats.getUsage(request) : null)
        })
    }
}
