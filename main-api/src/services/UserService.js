const UserRepository = require('../repositories/UserRepository');
const bcrypt = require('bcryptjs');
const { NotFoundError, UnauthorizedError } = require('../utils/CustomError');

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async createUser(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const user = await this.userRepository.create({
      username: userData.username,
      password: hashedPassword
    });

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
