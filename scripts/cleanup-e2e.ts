import { dropTestSchema } from "./test-database";
export default async function cleanup() {
  if (process.env.E2E_SCHEMA) await dropTestSchema(process.env.E2E_SCHEMA);
}
