var Joi = require('joi');

var schemaStatus = Joi.object().keys({
    state: Joi.string(),
    message: Joi.array(),
    published: Joi.string()
});
// var schemaBasic = Joi.object().keys({
//     service: Joi.object().keys({
//         status: schemaStatus
//     })
// });

var schema = {
    createExpectedSchema: function(conf){
        var healthKeys = {
            cpu_load: conf.mech ?
                Joi.array().length(3).includes(Joi.number()).required() :
                Joi.array().length(3).includes(Joi.number()).required(),
            mem_free: conf.mech ?
                Joi.number().integer().required() :
                Joi.string().required(),
            mem_free_percent: conf.mech ?
                Joi.number().min(0).max(1).required() :
                Joi.string().required(),
            mem_total: conf.mech ?
                Joi.number().integer().required() :
                Joi.string().required(),
            os_uptime: conf.mech ?
                Joi.number().required() :
                Joi.string().required()
        };
        if(conf.usage){
            healthKeys.cpu_proc = conf.mech ?
                Joi.number().min(0).max(101).required() :
                Joi.string().required();
            healthKeys.mem_proc = conf.mech ?
                Joi.number().min(0).max(1).required() :
                Joi.string().required();
        }

        return Joi.object().keys({
            service: Joi.object().keys({
                env: Joi.string().required(),
                id: Joi.string().required(),
                custom: Joi.object().keys(conf.usage ? {
                    health: Joi.object().keys(healthKeys).required()
                } : {}),
                name: Joi.string().required(),
                status: schemaStatus.required(),
                version: Joi.string().required()
            }).required()
        });
    }
};
schema.basic = schema.createExpectedSchema({mech:false,usage:false});
schema.mech = schema.createExpectedSchema({mech:true,usage:false});
schema.mechUsage = schema.createExpectedSchema({mech:true,usage:true});
schema.usage = schema.createExpectedSchema({mech:false,usage:true});

module.exports = schema;