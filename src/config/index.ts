import * as dotenv from 'dotenv';

dotenv.config();
const port = Number(process.env.API_PORT);
console.log(port, 'port');

if (isNaN(port)) {
  throw new Error('❌ API_PORT noto‘g‘ri yoki aniqlanmagan .env faylda!');
}
export type ConfigType = {
  API_PORT: number;
};

export const config: ConfigType = {
  API_PORT: parseInt(process.env.API_PORT as string, 10),
};
