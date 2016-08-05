module.exports = {
    auth: false,
    custom: {},
    env: 'DEV',
    id: 'git',
    lang: 'en',
    test: {
        node: [function (cb) {
            cb(false, 'no node tests have been defined')
        }],
        features: [function (cb) {
            cb(false, 'no feature tests have been defined')
        }]
    },
    defaultContentType: 'text/plain',
    name: 'my_service',
    path: '/service-status',
    state: {
        good: 'GOOD',
        bad: 'BAD',
        warn: 'WARN'
    },
    usage: true,
    version: '0.0.0'
}
