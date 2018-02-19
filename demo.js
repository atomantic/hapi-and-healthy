/**
 * Hapi-and-healthy API demo
 * @author Adam Eivy
 *
 * \[._.]/
 *
 * This demonstrates the hapi-and-healthy plugin for rendering a configurable health/service-status API
 */
// Server Layer
// http://hapijs.com/api
const Hapi = require('hapi')
// include package so we can get the version number
const pjson = require('./package.json')

const server = new Hapi.Server({
  port: 3192
})

server.register([{
  // a real app would do this:
  //plugin: require('hapi-and-healthy'),
  // but I'm dogfooding here:
  plugin: require('./index'),
  options: {
    //defaultContentType: 'application/json',
    // recommend setting the env var with PM2 process.json file
    // https://github.com/Unitech/PM2/blob/development/ADVANCED_README.md#json-app-declaration
    env: process.env.APP_ENV || 'QA',
    name: pjson.name,
    test: {
      // a series of tests that will tell if this node
      // is configured badly or has some other reason it
      // should be pulled out of rotation
      node: [
        () => new Promise((resolve, reject) => {
          // todo: test git commit hash / checksum against memcached manifest
          // to see if this node is in compliance with the release version
          resolve('code checksum matches manifest')
        })
      ],
      features: [
        () => new Promise((resolve, reject) => {
          // TODO: query a status report of a cron smoke test or
          // query memcached/redis, etc for logs of failures within a given timeframe
          // if we hit a threshold, return cb(true, message), which will throw this
          // node into WARN state
          resolve('some feature or API endpoint passed tests')
        })
      ]
    },
    paths: ['v1', 'v2'],
    version: pjson.version
  }
}])
.then(() => server.start())
.then(() => console.log(`Server running at: ${server.info.uri} with ${pjson.version}`));