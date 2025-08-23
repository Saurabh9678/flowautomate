const express = require('express');
const UserController = require('../controllers/UserController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();
const userController = new UserController();

// User routes with asyncHandler for automatic error handling
router.post('/register', asyncHandler(userController.createUser.bind(userController)));
router.post('/login', asyncHandler(userController.login.bind(userController)));
router.get('/', asyncHandler(userController.getAllUsers.bind(userController)));
router.get('/:id', asyncHandler(userController.getUserById.bind(userController)));
router.put('/:id', asyncHandler(userController.updateUser.bind(userController)));
router.delete('/:id', asyncHandler(userController.deleteUser.bind(userController)));

module.exports = router;
