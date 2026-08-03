// import app from "./app";
// import { env } from "./config/env";

// app.listen(Number(env.PORT), () => {
//   console.log(`API running on port ${env.PORT}`);
// });

import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env["PORT"] ?? 3001);

const app = createApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`api listening on port ${port}`);
});