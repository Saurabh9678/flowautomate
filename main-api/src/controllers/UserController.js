const UserService = require('../services/UserService');
const { successResponse } = require('../utils/apiResponse');
const { generateToken } = require('../utils/jwt');

class UserController {
  constructor() {
    this.userService = new UserService();
  }

  async createUser(req, res) {
    // Joi validation has already validated and sanitized req.body
    const user = await this.userService.createUser(req.body);
    successResponse(res, 201, user, 'User created successfully', null);
  }

  async getUserById(req, res) {
    const userId = req.user.userId
    const user = await this.userService.getUserById(userId);

    // TRANSFORMED USER DATA
    const transformedUser = {
      username: user.username,
    };
    successResponse(res, 200, transformedUser, 'User fetched successfully', null);
  }

  async login(req, res) {
    const { username, password } = req.body;
    
    const user = await this.userService.validateUser(username, password);
    
    const token = generateToken(user.id, process.env.JWT_EXPIRES_IN);
    
    successResponse(res, 200, { user, token }, 'User logged in successfully', null);
  }
}

module.exports = UserController;
