var pjson = require('../../package.json');
module.exports = {
    plugin: require('../../'),
    options: {
        env: 'FOO',
        id: '1',
        name: pjson.name,
        test:{
            node:[function(cb){
                return cb(null,'memcache all good');
            },function(cb){
                return cb(null,'checksum good');
            }],
            features:[function(cb){
                return cb(null, 'some feature is available');
            }]
        },
        state:{
            good: 'HEALTHY',
            bad: 'FATAL',
            warn: 'WARN'
        },
        path: '/service-status',
        version: pjson.version
    }
};