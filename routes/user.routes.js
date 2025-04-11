import { Router } from 'express';

import authorize from '../middlewares/auth.middleware.js'
import { getUser, getUsers } from '../controllers/user.controller.js'
import isAdmin from '../middlewares/admin.middleware.js';

const userRouter = Router();

//dummy routes for testing purposes
// userRouter.get('/',(req,res) => res.send({title:"get users"}))

userRouter.get('/',authorize,isAdmin, getUsers); //can only be accessed by admin users;

userRouter.get('/:id', authorize, getUser); //in the authorize middleware we set req.user to the user object that we are getting from token so the next middleware can access it and know which user  data is to be returned
//does it handles the logic of checking if the user trying to fetch the data is the same user or not?

userRouter.post('/', (req, res) => res.send({ title: 'CREATE new user' }));

userRouter.put('/:id', (req, res) => res.send({ title: 'UPDATE user' }));

userRouter.delete('/:id', (req, res) => res.send({ title: 'DELETE user' }));

export default userRouter;