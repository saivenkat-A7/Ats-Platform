const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/jobController');

router.use(auth); // every job route needs login

router.post('/', c.createJob);
router.get('/', c.getJobs);
router.get('/:id', c.getJobById);
router.put('/:id', c.updateJob);
router.delete('/:id', c.deleteJob);

module.exports = router;
