var Lab = require('lab'),
    Hapi = require('hapi');

// test shortcuts
var lab = exports.lab = Lab.script();
var before = lab.before;
var after = lab.after;
var describe = lab.describe;
var it = lab.it;
// lab.expect uses chai: http://chaijs.com/
var expect = Lab.expect;

describe('Hapi-and-Healthy plugin', function() {

    var server = new Hapi.Server();

    it('should load plugin succesfully', function(done){
        server.pack.register({
            plugin: require('../'),
            options: {
                ltm:{
                    test:[]
                },
                path:{
                    ltm: '/service-status',
                    main: '/service-status/full',
                    human: '/service-status/human'
                },
                state:{
                    good: "HEALTHY",
                    bad: "FATAL",
                    warn: "WARN"
                }
            }
        },
        function(err) {
            expect(err).to.equal(undefined);
            done();
        });
    });
 
    it('should register arbitrary routes', function(done) {
        var table = server.table();
 
        expect(table).to.have.length(3);
        expect(table[0].path).to.equal('/service-status');
        expect(table[1].path).to.equal('/service-status/full');
        expect(table[2].path).to.equal('/service-status/human');
 
        done();
    });

    it('should respond with 200 code and arbitrary text at LTM monitor endpoint',function(done){
        server.inject({
            method: "GET",
            url: "/service-status"
        }, function(response) {
     
            expect(response.statusCode).to.equal(200);
            expect(response.result).to.equal('HEALTHY');
     
            done();
        });
    });


    it('should respond with 200 and stats at full endpoint',function(done){
        server.inject({
            method: "GET",
            url: "/service-status/full"
        }, function(response) {
            console.log(response.result);

            var health = response.result.health;
            expect(response.statusCode).to.equal(200);
            expect(health.cpu_load).to.be.ok;

            // TODO: use Joi to validate payload schema
     
            done();
        });
    });

});