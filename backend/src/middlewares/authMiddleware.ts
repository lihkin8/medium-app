import { Context, Next } from "hono";
import { verify } from "hono/jwt";

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization") || "";
  console.log("Auth middleware triggered");
  const user = await verify(authHeader, c.env.JWT_SECRET);

  if (!user) {
    c.status(403);
    return c.json({ error: "You are not logged in!!" }, 403);
  }

  c.set("userId", user.id);

  await next();
};
