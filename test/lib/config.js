var pjson = require('../../package.json')
module.exports = {
    plugin: require('../../'),
    options: {
        env: 'FOO',
        id: '1',
        name: pjson.name,
        test: {
            node: [
                function () {
                    return new Promise(function (resolve, reject) {
                        resolve('memcache all good')
                    })
                },
                function () {
                    return new Promise(function (resolve, reject) {
                        resolve('checksum good')
                    })
                },
            ],
            features: [
                function () {
                    return new Promise(function (resolve, reject) {
                        resolve('some feature is available')
                    })
                },
                function () {
                    return new Promise(function (resolve, reject) {
                        resolve('another feature is available')
                    })
                }
            ]
        },
        state: {
            good: 'HEALTHY',
            bad: 'FATAL',
            warn: 'WARN'
        },
        path: '/service-status',
        version: pjson.version,
        usage: true
    }
}
