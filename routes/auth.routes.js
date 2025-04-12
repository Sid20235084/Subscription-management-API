import { Router } from "express";

import { signUp, signIn, signOut } from "../controllers/auth.controller.js";

const authRouter = Router();

//dummy routes for testing purposes
// authRouter.post('/sign-up',(req,res) => res.send({title:"sign-up"}))

//path:/api/v1/auth/sign-up(Post)
authRouter.post("/sign-up", signUp);
authRouter.post("/sign-in", signIn);
authRouter.post("/sign-out", signOut);

export default authRouter;
