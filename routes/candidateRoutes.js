const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/candidateController');

router.use(auth);

router.post('/', c.createCandidate);
router.get('/', c.getCandidates);
router.get('/:id', c.getCandidateById);
router.put('/:id', c.updateCandidate);
router.delete('/:id', c.deleteCandidate);

module.exports = router;
