module.exports = function (opt) {
    var buildStatus = require('./buildStatus')(opt);
    return {
        method: 'GET',
        path: opt.path,
        config: {
            auth: false,
            // cache:{
            //     expiresIn: 86400000,
            //     privacy: 'public'
            // },
            tags: ['api', 'health', 'status'],
            description: 'Simple LTM monitor API to determine if the node is bad. Responds with text/plain and 200 or 500 code.',
            notes: 'Returns a web service\'s current health status state. Status State String: HEALTHY, WARN, FATAL. WARN is a (graceful) degraded state - service only provides core, required functionality when in this state. If LTM detects non-200 response or FATAL, node should be pulled from rotation immediately.'
        },
        handler: buildStatus
    };
};
