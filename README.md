# \\[._.]/ - Hapi and Healthly API



[![](http://img.shields.io/gratipay/antic.svg?style=flat)](https://gratipay.com/antic)
[![](http://img.shields.io/npm/dm/hapi-and-healthy.svg?style=flat)](https://www.npmjs.org/package/hapi-and-healthy)
[![](http://img.shields.io/npm/v/hapi-and-healthy.svg?style=flat)](https://www.npmjs.org/package/hapi-and-healthy)
[![](http://img.shields.io/codeclimate/github/atomantic/hapi-and-healthy.svg?style=flat)](https://codeclimate.com/github/atomantic/hapi-and-healthy)
[![](http://img.shields.io/codeclimate/coverage/github/atomantic/hapi-and-healthy.svg?style=flat)](https://codeclimate.com/github/atomantic/hapi-and-healthy)
[![](http://img.shields.io/travis/atomantic/hapi-and-healthy.svg?style=flat)](https://travis-ci.org/atomantic/hapi-and-healthy)
[![](http://img.shields.io/david/atomantic/hapi-and-healthy.svg?style=flat)](https://www.npmjs.org/package/hapi-and-healthy)

This Hapi.js plugin provides configurable routes for /health API reporting, specifically with the goal of providing valuable endpoints for different consumers.

The primary consumer is a Local Traffic Manager (LTM), which load balances and adds/removes nodes from rotation based on the API return status. You can add an arbitrary number of tests to the ltm.test array, which will run and report status for the LTM API. Keep in mind that an LTM will hit this API about ~1/sec so the test functions should run really fast :)

Another API endpoint is provided for machine readable status of the node health, reporting cpu and memory load for the system and for the hapi server process itself.

Lastly, there's a human friendly version of the machine endpoint, which converts values from bytes to KB/MB/GB and usage to percentage of the system rather than flat values.


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


## Usage:

### Configuration Options

- `auth` - (`string`) The name of the auth strategy
- `id` - (`string`) An ID of the state of this system (by default, we will run `git rev-parse head` to fill this value)
- `name` - (`string`) The name of your service (reported in verbose mode), probably supplied by your package.json
- `path` - (`string`) An override path for the default `'/health'` endpoint
- `test.ltm` - (`array`) A set of async functions to run for testing your node health
  - each function must have a signature compatible with async.parallel `function(callback){callback(err, message)}`
  - `message` is an optional mixed value (json or string) that will give more info about that status
  - NOTE: eventually, we'll have more test options here
- `version` - (`string`) - the version of your service (probably from your package.json)

## Examples:

```
var server = hapi.createServer();

server.pack.register({
  plugin: require("hapi-and-healthy"),
  options: {
    auth: 'status_auth_strategy',
    name: pjson.name,
    path: '/service-status', // default = /health
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

## Spec


### `/health`
returns simple health check for LTM (Local Traffic Manager) monitoring.

This route will enforce auth:false since the LTM needs to hit this so frequently and it does
not expose sensitive data

If the node fails any of the test functions supplied in `options.test.node`
```
⇒  curl -i -H "Accept: text/plain" http://127.0.0.1:3192/health
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
⇒  curl -i -H "Accept: text/plain" http://127.0.0.1:3192/health
HTTP/1.1 200 OK
content-type: text/plain; charset=utf-8
content-length: 4
cache-control: no-cache
accept-ranges: bytes
Date: Wed, 03 Sep 2014 23:16:33 GMT
Connection: keep-alive

GOOD%
```

### `/health?v`
runs full, verbose suite of health checks and returns machine friendly output

```json
{
  "service": {
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


### `/health?v&h`
runs full, verbose suite of health checks and returns human friendly output
```json
{
  "service": {
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
