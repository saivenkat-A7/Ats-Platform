const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/applicationController');

router.use(auth);

router.post('/', c.applyToJob);
router.get('/', c.getApplications);
router.put('/:id/status', c.updateStatus);

module.exports = router;
