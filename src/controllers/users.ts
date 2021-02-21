import * as express from 'express';
import { resourceLimits } from 'worker_threads';
import { UserService } from '../services/user-service';
import { ValidationException } from '../models/validation-exception';
import { ValidationKeyword } from '../enums/validation-keyword';

const router = express.Router();

const deletePasswordField = (user) => {
  delete user.password;
  delete user.salt;
  return user;
}

router.route('/').get(async(req, res) => {
  let users = await UserService.getInstance().getUsers()
  users = users.map(deletePasswordField);
  res.json(users);
  return res;
});

// just added this temporarily to clear out the users created before the encrypted password
router.route('/clear').get(async(req, res) => {
  const users = await UserService.getInstance().clearUsers()
  res.json(users);
  return res;
});

router.route('/add').post(async (req, res) => {
  const existingUser = await UserService.getInstance().getUserByEmail(req.body.email);
  if (existingUser) {
    const exception = new ValidationException('email', ValidationKeyword.emailExists, 'email already exists');
    res.status(400).json(exception.json);
    return res;
  }
  const newUser = await UserService.getInstance().createUser(req.body.email, req.body.password).catch((err) => {
    const exception = new ValidationException(ValidationKeyword.server, ValidationKeyword.server, 'unexpected error. check logs');
    res.status(400).json(exception.json);
    return res;
  })
  res.json(deletePasswordField(newUser));
  return res;
});

export default router;