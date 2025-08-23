const UserRepository = require('../repositories/UserRepository');
const bcrypt = require('bcryptjs');
const { NotFoundError, UnauthorizedError } = require('../utils/CustomError');

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async createUser(userData) {
    // Hash password before saving
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const user = await this.userRepository.create({
      username: userData.username,
      password: hashedPassword
    });

    // Return user without password
    const { password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }

  async getUserById(id) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found', 'User');
    }
    
    const { password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }

  async updateUser(id, userData) {
    // If password is being updated, hash it
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 12);
    }

    const user = await this.userRepository.update(id, userData);
    const { password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }

  async deleteUser(id) {
    return await this.userRepository.delete(id);
  }

  async getAllUsers() {
    const users = await this.userRepository.findAll();
    return users.map(user => {
      const { password, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword;
    });
  }

  async validateUser(username, password) {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const { password: _, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }
}

module.exports = UserService;
