// http://lodash.com/
const _ = require('lodash')
// https://github.com/atomantic/undermore
// TODO: grab individual modules from undermore
_.mixin(require('undermore'))
_.mixin({
    isotime: function(){
        return (new Date()).toISOString()
    }
})
module.exports = _
