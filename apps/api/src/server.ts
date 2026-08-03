import { createApp } from "./app.js";
import { env } from "./config/env";

const port = Number(env.PORT);

const app = createApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on port ${port}`);
});
