const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const {
  validateGroupCreation,
  validateId,
  validateGroupSearch
} = require('../middleware/validation');

const GroupController = require('../controllers/groupController');

const router = express.Router();

// Rotas protegidas (requer autenticação)
router.post('/', authenticateToken, validateGroupCreation, GroupController.createGroup);
router.get('/my-groups', authenticateToken, GroupController.getMyGroups);
router.post('/:id/join', authenticateToken, validateId, GroupController.joinGroup);
router.post('/:id/leave', authenticateToken, validateId, GroupController.leaveGroup);
router.put('/:id', authenticateToken, validateId, GroupController.updateGroup);
router.delete('/:id', authenticateToken, validateId, GroupController.deleteGroup);
router.get('/:id/members', authenticateToken, validateId, GroupController.getGroupMembers);

// Rotas públicas (com autenticação opcional)
router.get('/', optionalAuth, validateGroupSearch, GroupController.getGroups);
router.get('/search', optionalAuth, validateGroupSearch, GroupController.searchGroups);
router.get('/:id', optionalAuth, validateId, GroupController.getGroupById);

module.exports = router;
