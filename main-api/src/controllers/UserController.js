const UserService = require('../services/UserService');
const { successResponse } = require('../utils/apiResponse');
const { 
  NotFoundError, 
  ValidationError, 
  UnauthorizedError 
} = require('../utils/CustomError');

class UserController {
  constructor() {
    this.userService = new UserService();
  }

  async createUser(req, res) {
    const user = await this.userService.createUser(req.body);
    successResponse(res, 201, user, 'User created successfully', null);
  }

  async getUserById(req, res) {
    const user = await this.userService.getUserById(req.params.id);
    
    if (!user) {
      throw new NotFoundError('User not found', 'User');
    }
    
    successResponse(res, 200, user, 'User fetched successfully', null);
  }

  async updateUser(req, res) {
    const user = await this.userService.updateUser(req.params.id, req.body);
    
    if (!user) {
      throw new NotFoundError('User not found', 'User');
    }
    
    successResponse(res, 200, user, 'User updated successfully', null);
  }

  async deleteUser(req, res) {
    const deleted = await this.userService.deleteUser(req.params.id);
    
    if (!deleted) {
      throw new NotFoundError('User not found', 'User');
    }
    
    successResponse(res, 200, null, 'User deleted successfully', null);
  }

  async getAllUsers(req, res) {
    const users = await this.userService.getAllUsers();
    successResponse(res, 200, users, 'Users fetched successfully', null);
  }

  async login(req, res) {
    const { username, password } = req.body;
    
    if (!username || !password) {
      throw new ValidationError('Username and password are required');
    }
    
    const user = await this.userService.validateUser(username, password);
    
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }
    
    successResponse(res, 200, user, 'User logged in successfully', null);
  }
}

module.exports = UserController;
