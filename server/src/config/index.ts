import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

dotenvConfig();

const configSchema = z.object({
  port: z.coerce.number().default(8787),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  mistral: z.object({
    feature1: z.object({
      key: z.string().optional(),
      model: z.string().default('mistral-small-latest'),
    }),
    feature2: z.object({
      key: z.string().optional(),
      model: z.string().default('mistral-small-latest'),
    }),
    feature3: z.object({
      key: z.string().optional(),
      model: z.string().default('mistral-large-latest'),
    }),
    brief: z.object({
      key: z.string().optional(),
      model: z.string().default('mistral-medium-latest'),
    }),
  }),
});

export type Config = z.infer<typeof configSchema>;

const rawConfig = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  logLevel: process.env.LOG_LEVEL,
  mistral: {
    feature1: {
      key: process.env.MISTRAL_FEATURE1_KEY,
      model: process.env.MISTRAL_FEATURE1_MODEL,
    },
    feature2: {
      key: process.env.MISTRAL_FEATURE2_KEY,
      model: process.env.MISTRAL_FEATURE2_MODEL,
    },
    feature3: {
      key: process.env.MISTRAL_FEATURE3_KEY,
      model: process.env.MISTRAL_FEATURE3_MODEL,
    },
    brief: {
      key: process.env.MISTRAL_BRIEF_KEY,
      model: process.env.MISTRAL_BRIEF_MODEL,
    },
  },
};

export const config: Config = configSchema.parse(rawConfig);
