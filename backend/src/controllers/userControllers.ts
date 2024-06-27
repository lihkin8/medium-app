import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign } from "hono/jwt";
import { Context } from "hono";
import { signupSchema, signinSchema } from "@nikhilshaz3/medium-common/dir";

// Function to hash the password using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

export const signupController = async (c: Context) => {
  const body = await c.req.json();

  // Use safeParse to validate the request body
  const parsedResult = signupSchema.safeParse(body);

  if (!parsedResult.success) {
    return c.json({ error: parsedResult.error.errors }, 400);
  }

  const { name, email, password } = parsedResult.data;

  // Hash the password using Web Crypto API
  const hashedPassword = await hashPassword(password);

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Generate a JWT token using jsonwebtoken
    const token = await sign({ id: user.id }, c.env.JWT_SECRET);

    return c.json({ message: "User created successfully", token });
  } catch (error) {
    console.error(error);
    return c.json({ error: "An error occurred while creating the user" }, 500);
  }
};

export const signinController = async (c: Context) => {
  const body = await c.req.json();

  // Use safeParse to validate the request body
  const parsedResult = signinSchema.safeParse(body);

  if (!parsedResult.success) {
    return c.json({ error: parsedResult.error.errors }, 400);
  }

  const { email, password } = parsedResult.data;

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const user = await prisma.user.findUnique({
    where: {
      email,
      password: await hashPassword(password),
    },
  });

  if (!user) {
    return c.json({ error: "Invalid email or password" }, 400);
  }

  const token = await sign({ id: user.id }, c.env.JWT_SECRET);

  return c.json({ message: "User signed in successfully", token });
};
