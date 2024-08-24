import { app } from "./app";
import { env } from "./env";

app
  .listen({
    port: env.PORT,
    host:
      env.NODE_ENV === "development" || env.NODE_ENV === "test"
        ? "localhost"
        : "0.0.0.0",
  })
  .then(() => {
    console.log("HTTP Server Running!");
  });
