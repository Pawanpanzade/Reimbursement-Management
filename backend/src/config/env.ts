import 'dotenv/config';

const parseBooleanEnv = (value: string | undefined): boolean => {
  return value === 'true' || value === '1';
};

const skipDbConnect = parseBooleanEnv(process.env.SKIP_DB_CONNECT);

const requiredVariables = ['JWT_SECRET'] as const;

requiredVariables.forEach((variable) => {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
});

if (!skipDbConnect && !process.env.DATABASE_URL) {
  throw new Error('Missing required environment variable: DATABASE_URL');
}

const portFromEnv = Number(process.env.PORT ?? 4000);

if (Number.isNaN(portFromEnv) || portFromEnv <= 0) {
  throw new Error('PORT must be a valid positive number.');
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: portFromEnv,
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET as string,
  skipDbConnect,
} as const;
