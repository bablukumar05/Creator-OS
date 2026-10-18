import { z } from 'zod';
import { resources } from '../../shared/resources.js';

const id = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid reference');

export const schemas = Object.fromEntries(
  Object.entries(resources).map(([key, config]) => [
    key,
    z
      .object(
        Object.fromEntries(
          config.fields.map((f) => {
            let s;
            if (f.type === 'relation') {
              s = id;
            } else if (f.type === 'number') {
              s = z.coerce.number().min(0).max(1e12);
            } else if (f.type === 'date') {
              s = z.iso.date();
            } else if (f.type === 'checkbox') {
              s = z.boolean();
            } else if (f.type === 'items') {
              s = z
                .array(
                  z.object({
                    description: z.string().min(1).max(500),
                    quantity: z.coerce.number().positive().max(1e6),
                    rate: z.coerce.number().min(0).max(1e9),
                  }),
                )
                .min(1)
                .max(100);
            } else if (f.options) {
              s = z.enum(f.options);
            } else if (f.type === 'email') {
              s = z.string().email();
            } else if (f.type === 'url') {
              s = z
                .string()
                .trim()
                .refine((v) => !v || /^https?:\/\/[^\s]+$/.test(v), 'Must be a valid HTTP(S) URL');
            } else {
              s = z
                .string()
                .trim()
                .max(f.type === 'textarea' ? 10000 : 500);
            }

            if (['tax', 'progress'].includes(f.key) && f.type === 'number') {
              s = s.max(100, 'Percentage cannot exceed 100');
            }

            if (f.required) {
              if (
                typeof s.min === 'function' &&
                ['text', 'textarea', 'email', 'url', 'relation'].includes(f.type || 'text')
              ) {
                s = s.min(1, 'This field is required');
              }
            } else {
              s = s.optional();
            }
            return [f.key, s];
          }),
        ),
      )
      .strict(),
  ]),
);

export function parseResource(key, body, partial = false) {
  const cleaned = Object.fromEntries(
    Object.entries(body).filter(
      ([field, v]) =>
        (v !== '' && v !== null) || resources[key].fields.find((f) => f.key === field)?.required,
    ),
  );
  const data = (partial ? schemas[key].partial() : schemas[key]).parse(cleaned);
  return data;
}