const express = require('express');
const UserController = require('../controllers/UserController');
const asyncHandler = require('../middleware/asyncHandler');
const { 
    validateBody
} = require('../middleware/joiValidation');

const { authenticateToken } = require('../middleware/auth');
const { 
    registerUserSchema,
    loginUserSchema
} = require('../validations/userValidation');


const router = express.Router();
const userController = new UserController();

router.post('/register', validateBody(registerUserSchema), asyncHandler(userController.createUser.bind(userController)));
router.post('/login', validateBody(loginUserSchema), asyncHandler(userController.login.bind(userController)));
router.get('/', authenticateToken, asyncHandler(userController.getUserById.bind(userController)));

module.exports = router;
