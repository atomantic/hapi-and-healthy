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
This is an early version. I expect much more configuration and additions over the coming weeks. This is an effort to create a hapi plugin for a service-status API standard that is mostly finalized but still someone in progress.

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

```
var server = hapi.createServer();

server.pack.register({
  plugin: require("hapi-and-healthy"),
  options: {
    auth: 'status_auth_strategy',
    ltm:{
      // a series of tests that will tell if this node
      // is configured badly or has some other reason it
      // should be pulled out of rotation
      test:[
        function(){
          // Example TODO: test if this node can connect to local memcached
          // if not, there's something wrong with the configuration
          // and this test should return false
          return true;
        },
        function(){
          // Example TODO: check the commit hash/checksum of the deployed code
          // if it doesn't match the manifest, this node is not what we want
          // in the pool
          return false;
        }
        // etc...
      ]
    }
  }
  },
  function (err){
    if(err){
      throw err;
    }
  }
);
```

## Default Routes:

These are configurable via options.path.health, options.path.human, and options.path.ltm:

### `/health`
runs full, verbose suite of health checks and returns machine friendly output

```
{
  health: {
    cpu_load: [
      1.619140625,
      1.732421875,
      1.88818359375
    ],
    cpu_proc: 0.1,
    mem_free: 354811904,
    mem_free_percent: 0.02065277099609375,
    mem_proc: 0.0018384456634521484,
    mem_total: 17179869184,
    os_uptime: 606723
  }
}
```


### `/health/human`
runs full, verbose suite of health checks and returns human friendly output
```
{
  health: {
    cpu_load: [
      2.263671875,
      2.107421875,
      2.05810546875
    ],
    cpu_proc: "0.00%",
    mem_free: "464.19 MB",
    mem_free_percent: "0.03%",
    mem_proc: "0.00%",
    mem_total: "17.18 GB",
    os_uptime: "10 minutes, 7.686 seconds"
  }
}
```

### `/health/ltm`
returns simple health check for LTM (Local Traffic Manager) monitoring.

This route will enforce auth:false since the LTM needs to hit this so frequently and it does
not expose sensitive data

If the node fails any of the test functions supplied in `options.ltm.test`
```
⇒  curl -i http://127.0.0.1:3192/health/ltm
HTTP/1.1 500 Internal Server Error
content-type: text/plain; charset=utf-8
content-length: 3
cache-control: no-cache
Date: Wed, 03 Sep 2014 23:16:54 GMT
Connection: keep-alive

BAD%
```

OR, if the node passes all the LTM tests supplied in `options.ltm.test`
```
⇒  curl -i http://127.0.0.1:3192/health/ltm
HTTP/1.1 200 OK
content-type: text/plain; charset=utf-8
content-length: 4
cache-control: no-cache
accept-ranges: bytes
Date: Wed, 03 Sep 2014 23:16:33 GMT
Connection: keep-alive

GOOD%
```
