import type { Context } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { z } from "zod";

// Define the schema using Zod
const blogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

const updateBlogSchema = z.object({
  id: z.string().min(1, "ID is required"),
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
});

export const createBlogController = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();

    // Validate the request body
    const parsedResult = blogSchema.safeParse(body);
    if (!parsedResult.success) {
      return c.json({ error: parsedResult.error.errors }, 400);
    }

    console.log("Creating blog with data:", body);
    const post = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: userId,
      },
    });
    console.log("Blog created:", post);
    return c.json({
      id: post.id,
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    return c.json({ error: "An error occurred while creating the blog" }, 500);
  }
};

export const updateBlogController = async (c: Context) => {
  try {
    const userId = c.get("userId");
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();

    // Validate the request body
    const parsedResult = updateBlogSchema.safeParse(body);
    if (!parsedResult.success) {
      return c.json({ error: parsedResult.error.errors }, 400);
    }

    console.log("Updating blog with data:", body);
    const post = await prisma.post.update({
      where: {
        id: body.id,
        authorId: userId,
      },
      data: {
        title: body.title,
        content: body.content,
      },
    });
    console.log("Blog updated:", post);
    return c.text("updated post");
  } catch (error) {
    console.error("Error updating blog:", error);
    return c.json({ error: "An error occurred while updating the blog" }, 500);
  }
};

export const getBlogController = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    console.log("Fetching blog with ID:", id);
    const post = await prisma.post.findUnique({
      where: {
        id: id,
      },
    });

    if (!post) {
      console.log("Blog not found");
      return c.json({ error: "Blog not found" }, 404);
    }

    console.log("Blog fetched:", post);
    return c.json(post);
  } catch (error) {
    console.error("Error fetching blog:", error);
    return c.json({ error: "An error occurred while fetching the blog" }, 500);
  }
};

export const getAllBlogsController = async (c: Context) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Get query parameters for pagination
    const page = Number(c.req.query("page") || 1); // Default to page 1 if not provided
    const limit = Number(c.req.query("limit") || 10); // Default to 10 items per page if not provided

    console.log("Fetching all blogs with pagination");
    const blogs = await prisma.post.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    console.log("Blogs fetched:", blogs);

    if (!blogs.length) {
      console.log("No blogs found");
      return c.json({ error: "No blogs found" }, 404);
    }

    // Fetch total number of blogs for pagination info
    const totalBlogs = await prisma.post.count();
    const totalPages = Math.ceil(totalBlogs / limit);

    return c.json({
      blogs,
      meta: {
        totalBlogs,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return c.json({ error: "An error occurred while fetching blogs" }, 500);
  }
};
