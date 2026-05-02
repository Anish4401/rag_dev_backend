import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.BACKEND_PORT, () => {
  console.log(`Backend listening on http://localhost:${env.BACKEND_PORT}`);
});
