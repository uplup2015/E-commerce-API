import Joi from 'joi';

export const createProductSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  price: Joi.number().positive().precision(2).required(),
  stock: Joi.number().integer().min(0).required(),
  images: Joi.array().items(Joi.string().uri()).default([]),
  categoryId: Joi.number().integer().positive().required(),
});

export const updateProductSchema = Joi.object({
  title: Joi.string().min(2).max(200),
  price: Joi.number().positive().precision(2),
  stock: Joi.number().integer().min(0),
  images: Joi.array().items(Joi.string().uri()),
  categoryId: Joi.number().integer().positive(),
}).min(1);

export const productQuerySchema = Joi.object({
  search: Joi.string().optional(),
  categoryId: Joi.number().integer().positive().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});
