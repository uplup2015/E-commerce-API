import Joi from 'joi';

export const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED')
    .required(),
});
