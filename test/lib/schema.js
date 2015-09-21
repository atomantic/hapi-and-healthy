var Joi = require('joi');

var schemaStatus = Joi.object().keys({
    state: Joi.string(),
    message: Joi.array().sparse(),
    published: Joi.string()
});
// var schemaBasic = Joi.object().keys({
//     service: Joi.object().keys({
//         status: schemaStatus
//     })
// });

var schema = {
    createExpectedSchema: function (conf) {
        var healthKeys = {
            cpu_load: Joi.array().length(3).items(Joi.number()).required(),
            mem_free: conf.human ?
                Joi.string().required() : Joi.number().integer().required(),
            mem_free_percent: conf.human ?
                Joi.string().required() : Joi.number().min(0).max(1).required(),
            mem_total: conf.human ?
                Joi.string().required() : Joi.number().integer().required(),
            os_uptime: conf.human ?
                Joi.string().required() : Joi.number().required()
        };
        if (conf.usage_proc) {
            healthKeys.cpu_proc = conf.human ?
                Joi.string().required() :
                Joi.number().min(0).max(201).required();
            healthKeys.mem_proc = conf.human ?
                Joi.string().required() :
                Joi.number().min(0).max(1).required();
        }

        return Joi.object().keys({
            service: Joi.object().keys({
                env: Joi.string().required(),
                id: Joi.string().required(),
                custom: Joi.object().keys(conf.usage ? {
                    health: Joi.object().keys(healthKeys).required()
                } : {}),
                name: Joi.string().required(),
                schema: Joi.string().required(),
                status: schemaStatus.required(),
                version: Joi.string().required()
            }).required()
        });
    }
};

module.exports = schema;
