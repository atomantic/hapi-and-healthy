# \\[._.]/ - Hapi and Healthly API

[![](http://img.shields.io/gratipay/antic.svg?style=flat)](https://gratipay.com/antic)
[![](http://img.shields.io/npm/dm/hapi-and-healthy.svg?style=flat)](https://www.npmjs.org/package/hapi-and-healthy)
[![](http://img.shields.io/npm/v/hapi-and-healthy.svg?style=flat)](https://www.npmjs.org/package/hapi-and-healthy)
[![](http://img.shields.io/codeclimate/github/atomantic/hapi-and-healthy.svg?style=flat)](https://codeclimate.com/github/atomantic/hapi-and-healthy)
[![](http://img.shields.io/travis/atomantic/hapi-and-healthy.svg?style=flat)](https://travis-ci.org/atomantic/hapi-and-healthy)
[![](http://img.shields.io/david/atomantic/hapi-and-healthy.svg?style=flat)](https://www.npmjs.org/package/hapi-and-healthy)

This [Hapi.js](https://www.npmjs.org/package/hapi) plugin provides a configurable route for `/service-status` (`/health`) API reporting which returns a varied output depending on the consumer headers, request type and query flags.

The primary consumer is a Local Traffic Manager (LTM), which load balances and adds/removes nodes from rotation based on the API return status. You can add an arbitrary number of tests to the test.node array (in config), which will run in parallel and report basic health status for your node. Keep in mind that an LTM will hit this API about ~1/sec so the test functions should run really fast. Caching policy and what those tests actual are is entirely up to the application :)

    NOTE: failing dependecy services should never cause your node to be marked bad. Your tests should only validate that your node is configured and running correctly (otherwise, an LTM would remove a good node out of the pool only because another service went down).

Additionally, query flags are provided for verbose output (`?v`) to machines and humans. This API will report cpu and memory load for the system and for the hapi server process itself. The human friendly flag (`?v&h`) converts values from bytes to KB/MB/GB and usage to percentage of the system rather than flat values


## NOTE:
v2.0.0 breaks backward compatibility in many ways:
- only one endpoint now
- health information is put into a server.custom payload (only in verbose mode with ?v query)
- lots of new config options
- now returning `git rev-parse HEAD` of main project as `id` in verbose body
- basically just look at the new spec (big changes)
- more docs to come as I flush this out for my service :)

## Installation:

```npm install --save hapi-and-healthy```

## Demo:

Run the demo to see it in action and view the demo.js file for the code
```
git clone git@github.com:atomantic/hapi-and-healthy.git
cd hapi-and-healthy;
npm install;
gulp;
```

## Tests:
```
git clone git@github.com:atomantic/hapi-and-healthy.git
cd hapi-and-healthy;
npm install;
npm test;
```


## Configuration Options

- `auth` - (`string`) The name of the auth strategy
- `env` - (`string`) The running environment of your app (e.g. `DEV`, `QA`, `STAGE`, `PROD`). This will be returned in verbose output for consumers wishing to know what environment your service thinks it's running in.
- `id` - (`string`) An ID of the state of this system (by default, we will run `git rev-parse head` to fill this value)
- `lang` - (`string`) Default 'en' a language override for the human output health data. This endpoint uses the [Humanize Duration package](https://www.npmjs.org/package/humanize-duration) so any valid language override for that library will be valid here (`fr`, `de`, `ko`, etc)
- `name` - (`string`) The name of your service (reported in verbose mode), probably supplied by your package.json
- `path` - (`string`) An override path for the default `'/service-status'` endpoint
- `test.ltm` - (`array`) A set of async functions to run for testing your node health
  - each function must have a signature compatible with async.parallel `function(callback){callback(err, message)}`
  - `message` is an optional mixed value (json or string) that will give more info about that status
  - NOTE: eventually, we'll have more test options here
- `version` - (`string`) - the version of your service (probably from your package.json)

### Examples

```javascript
var server = hapi.createServer();

server.pack.register({
  plugin: require("hapi-and-healthy"),
  options: {
    auth: 'status_auth_strategy',
    env: process.env.NODE_ENV||'DEV',
    name: pjson.name,
    test:{
      // a series of tests that will tell if this node
      // is valid or not
      node:[
        function(cb){
          // Example TODO: test if this node can connect to local memcached
          // if not, there's something wrong with the configuration
          // and this test should return false
          return cb(null, 'memcache is good');
        },
        function(cb){
          // Example TODO: check the commit hash/checksum of the deployed code
          // if it doesn't match the manifest, this node is not what we want
          // in the pool
          return cb(null, 'checksum matches manifest');
        }
        // etc...
      ]
    },
    version: pjson.version
  }
  },
  function (err){
    if(err){
      throw err;
    }
  }
);
```

## API

- The API endpoint is configurable but defaults to `/service-status`
- Additionally, the following query params are allowed:
    - `v` - verbose mode
    - `h` - human friendly mode
- GET requests supplied with header `If-None-Match: {etag}` will return 304 not modified and empty body if the etag (base64 encode of status output minus published date) is a match

## Spec


### `/service-status`
returns simple health check for LTM (Local Traffic Manager) monitoring.

This route will enforce auth:false since the LTM needs to hit this so frequently and it does
not expose sensitive data

If the node fails any of the test functions supplied in `options.test.node`
```
⇒  curl -i -H "Accept: text/plain" http://127.0.0.1:3192/service-status
HTTP/1.1 500 Internal Server Error
content-type: text/plain; charset=utf-8
content-length: 3
cache-control: no-cache
Date: Wed, 03 Sep 2014 23:16:54 GMT
Connection: keep-alive

BAD%
```

OR, if the node passes all the LTM tests supplied in `options.test.node`
```
⇒  curl -i -H "Accept: text/plain" http://127.0.0.1:3192/service-status
HTTP/1.1 200 OK
content-type: text/plain; charset=utf-8
content-length: 4
cache-control: no-cache
accept-ranges: bytes
Date: Wed, 03 Sep 2014 23:16:33 GMT
Connection: keep-alive

GOOD%
```

### `/service-status?v`
runs full, verbose suite of health checks and returns machine friendly output

```json
{
  "service": {
    "env": "DEV",
    "id": "98CF189C-36E0-416B-A2ED-90CE36F8D330",
    "name": "my_service",
    "version": "1.0.0",
    "custom": {
      "health": {
        "cpu_load": [
          1.619140625,
          1.732421875,
          1.88818359375
        ],
        "cpu_proc": 0.1,
        "mem_free": 354811904,
        "mem_free_percent": 0.02065277099609375,
        "mem_proc": 0.0018384456634521484,
        "mem_total": 17179869184,
        "os_uptime": 606723
      }
    },
    "status": {
      "state": "GOOD",
      "message": [
        "memcache is good",
        "checksum matches manifest"
      ],
      "published": "2014-09-24T03:27:59.575Z"
    }
  }
}


```


### `/service-status?v&h`
runs full, verbose suite of health checks and returns human friendly output
```json
{
  "service": {
    "env": "DEV",
    "id": "98CF189C-36E0-416B-A2ED-90CE36F8D330",
    "name": "my_service",
    "version": "1.0.0",
    "custom": {
      "health": {
        "cpu_load": [
          2.263671875,
          2.107421875,
          2.05810546875
        ],
        "cpu_proc": "0.00%",
        "mem_free": "464.19 MB",
        "mem_free_percent": "0.03%",
        "mem_proc": "0.00%",
        "mem_total": "17.18 GB",
        "os_uptime": "10 minutes, 7.686 seconds"
      }
    },
    "status": {
      "state": "GOOD",
      "message": [
        "memcache is good",
        "checksum matches manifest"
      ],
      "published": "2014-09-24T03:27:59.575Z"
    }
  }
}
```
