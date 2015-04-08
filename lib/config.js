module.exports = {
    custom: {},
    env: 'DEV',
    id: 'git',
    lang: 'en',
    test:{
        node:[function(cb){cb(false,'all good');}],
        features:[function(cb){cb(false,'all good');}]
    },
    defaultContentType: 'text/plain',
    name: 'my_service',
    path: '/service-status',
    state:{
        good: 'GOOD',
        bad: 'BAD',
        warn: 'WARN'
    },
    usage: true,
    usage_proc: true,
    version: '0.0.0'
};