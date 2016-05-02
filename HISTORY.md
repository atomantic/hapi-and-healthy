# History

## 4.1.x
  - Now using greenkeeper to keep dependencies up to date

## 4.1.0
  - add support for `paths` option to expose which versioned endpoints the API has available. This can be used for automated discovery of where API versioned feature status endpoints live (e.g. /v2/feature-status)

## 4.0.0
  - remove `usage` package as it didn't compile on many systems and caused problems with other libraries using this package
  - no longer supplying `cpu_proc` and `mem_proc` in verbose report

## 3.5.0
  - added schema version number for tracking the schema version as it changes across versions of this api

## 3.4.0
  - Addition of WARN state handling and running of options.tests.features

## 3.0.0
  - added defaultContentType, defaults to 'text/plain', which means hitting /service-status with no "accept" header will default to single word, plaintext reply

## 2.0.0
  - breaks backward compatibility in many ways:
  - only one endpoint now
  - health information is put into a server.custom payload (only in verbose mode with ?v query)
  - lots of new config options
  - now returning `git rev-parse HEAD` of main project as `id` in verbose body
  - basically just look at the new spec (big changes)
  - more docs to come as I flush this out for my service :)
