import { Hono } from "hono";
import {
  signupController,
  signinController,
} from "../controllers/userControllers";

const userRouter = new Hono();

userRouter.post("/signup", signupController);
userRouter.post("/signin", signinController);

export { userRouter };
