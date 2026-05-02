import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();
const host = process.env.HOST ?? "0.0.0.0";

app.listen(env.BACKEND_PORT, host, () => {
  console.log(`Backend listening on http://${host}:${env.BACKEND_PORT}`);
});
