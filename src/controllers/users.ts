import * as express from 'express';

const router = express.Router();

router.route('/').get((req, res) => {
  res.json({});

  return res;
});

router.route('/add').post((req, res) => {
  res.json({});
  return res;
});

export default router;