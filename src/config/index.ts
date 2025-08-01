import * as dotenv from 'dotenv';

dotenv.config();
export type ConfigType = {
  API_PORT: number;
};

export const config: ConfigType = {
  API_PORT: parseInt(process.env.API_PORT as string, 10),
};
