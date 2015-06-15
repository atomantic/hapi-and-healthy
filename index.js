var _ = require('./lib/_');
var config = require('./lib/config');

exports.register = function (server, options, next) {
    // merge custom options over default config
    var opt = _.merge(config, options);

    // allow custom objects to be passed by reference
    // lest _.merge copy the data at time of passing it
    opt.custom = options.custom || {};

    var routeConfig = require('./lib/route')(opt);

    // Hapi.js < 8 compat (plugin is invoked with server instead of plugin as first arg)
    if (server.servers) {
        // create an endpoint for each server
        server.servers.forEach(function (s) {
            s.route(routeConfig);
        });
    } else {
        server.route(routeConfig);
    }

    return next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};
