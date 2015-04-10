var Lab = require('lab');
var lab = exports.lab = Lab.script();
var before = lab.before;
var describe = lab.describe;

var fs = require('fs');

describe('purge output directory', function(){
    before(function (done) {
        console.log('bootstrapping tests...');
        // clean output directory
        var path = 'test/output';
        fs.readdirSync(path).forEach(function(file){
            if(file.indexOf('.json')!==-1){
                fs.unlinkSync(path + '/' + file);
            }
        });
        done();
    });
});