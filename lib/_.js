// http://lodash.com/
var _ = require('lodash')
// https://github.com/atomantic/undermore
_.mixin(require('undermore'))
_.mixin({
    isotime: function(){
        return (new Date()).toISOString()
    }
})
module.exports = _
