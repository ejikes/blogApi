const Joi = require("joi");

const createBlogSchema = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().allow("").optional(),
  body: Joi.string().min(20).required(),
  tags: Joi.string().allow("").optional()
});

const updateBlogSchema = Joi.object({
  title: Joi.string().min(3).optional(),
  description: Joi.string().allow("").optional(),
  body: Joi.string().min(20).optional(),
  tags: Joi.string().allow("").optional(),
  state: Joi.string().valid("draft", "published").optional()
});

module.exports = {
    createBlogSchema,
    updateBlogSchema
}