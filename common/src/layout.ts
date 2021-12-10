import Joi from 'joi';

export interface Layout {
	id: string,
	name: string,
	sourceCode: string,
}

export const layoutSchema = Joi.object<Layout>({
	id: Joi.string().uuid().required(),
	name: Joi.string().required(),
	sourceCode: Joi.string().required(),
});
