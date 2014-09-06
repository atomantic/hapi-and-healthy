# \\[._.]/ - Hapi and Healthly API

[![NPM version](https://badge.fury.io/js/hapi-and-healthy.png)](http://badge.fury.io/js/hapi-and-healthy)
![Dependencies](https://david-dm.org/atomantic/hapi-and-healthy.png)

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
    ltm:{
      // a series of tests that will tell if this node
      // is configured badly or has some other reason it
      // should be pulled out of rotation
      test:[
        function(){
          // TODO: test if this node can connect to memcached
          // if not, there's something wrong with the configuration
          // and return false
          return true;
        },
        function(){
          // TODO: check the commit hash/checksum of the deployed code
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
