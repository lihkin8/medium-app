import { Hono } from "hono";
import {
  getBlogController,
  createBlogController,
  updateBlogController,
  getAllBlogsController,
} from "../controllers/blogControllers";
import { authMiddleware } from "../middlewares/authMiddleware";

const blogRouter = new Hono();

blogRouter.use("*", authMiddleware);

// Define specific routes before the dynamic :id route
blogRouter.get("/bulk", getAllBlogsController); // Adjust this route as needed
blogRouter.get("/:id", getBlogController);
blogRouter.post("/", createBlogController);
blogRouter.put("/", updateBlogController);

export { blogRouter };
