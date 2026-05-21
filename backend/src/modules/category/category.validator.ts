import Joi from 'joi';

export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
});
