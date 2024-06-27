import { Hono } from "hono";
import { userRouter } from "./routers/userRoutes";
import { blogRouter } from "./routers/blogRoutes";
import { Context } from "hono";

// Create the main Hono app
const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

// Use the user and post routers
app.get("/", (c: Context) => {
  return c.json({ message: "Welcome to the Medium Backend" });
});
app.route("/api/v1/user", userRouter);
app.route("/api/v1/blog", blogRouter);

export default app;
