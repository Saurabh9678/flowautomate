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
    // Joi validation has already validated req.params.id
    const userId = req.user.userId
    const user = await this.userService.getUserById(userId);

    // TRANSFORMED USER DATA
    const transformedUser = {
      username: user.username,
    };
    successResponse(res, 200, transformedUser, 'User fetched successfully', null);
  }

  async updateUser(req, res) {
    // Joi validation has already validated req.params.id
    const user = await this.userService.updateUser(req.params.id, req.body);
    
    
    successResponse(res, 200, user, 'User updated successfully', null);
  }

  async deleteUser(req, res) {
    // Joi validation has already validated req.params.id
    await this.userService.deleteUser(req.params.id);
    
    successResponse(res, 200, null, 'User deleted successfully', null);
  }

  async getAllUsers(req, res) {
    const users = await this.userService.getAllUsers();
    successResponse(res, 200, users, 'Users fetched successfully', null);
  }

  async login(req, res) {
    // Joi validation has already validated req.body
    const { username, password } = req.body;
    
    const user = await this.userService.validateUser(username, password);
    
    const token = generateToken(user.id);
    
    successResponse(res, 200, { user, token }, 'User logged in successfully', null);
  }
}

module.exports = UserController;
