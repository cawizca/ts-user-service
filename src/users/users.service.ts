import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import { hashPassword } from 'src/auth/utils/bycrypt';
import { ClientKafka } from '@nestjs/microservices';

export type IUser = {
  id: number;
  email: string;
  password: string;
  role: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private _usersRepository: Repository<User>,
    @Inject('USER_SERVICE') private readonly kafkaClient: ClientKafka
  ) {}

  async findOne(email: string): Promise<IUser | undefined> {
    const user = await this._usersRepository.findOne({ where: { email } });
    return user ?? undefined;
  }

  async create(email: string, password: string): Promise<IUser> {
    const hashedPassword = await hashPassword(password);
    const user = this._usersRepository.create({
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this._usersRepository.save(user);
    return user;
  }

  async findById(id: number): Promise<IUser | undefined> {
    const user = await this._usersRepository.findOne({ where: { id } });
    if (!user) return undefined;
    // Exclude password from returned object
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as IUser;
  }

  async update(
    id: number,
    email: string,
    password: string,
    user: any
  ): Promise<IUser | undefined> {
    try {
      // Check if the user is trying to update their own profile
      if (Number(id) !== Number(user.userId)) {
        throw new ForbiddenException('You are not allowed to update this user');
      }

      const fetchedUser = await this._usersRepository.findOne({
        where: { id },
      });
      if (!fetchedUser) {
        throw new NotFoundException('User not found');
      }

      // Check if already account with this email
      const existingUser = await this._usersRepository.findOne({
        where: { email },
      });
      if (existingUser && existingUser.id !== id) {
        throw new ForbiddenException("You can't use this email");
      }

      fetchedUser.email = email;
      fetchedUser.password = await hashPassword(password);
      fetchedUser.updatedAt = new Date();
      await this._usersRepository.save(fetchedUser);
      return fetchedUser;
    } catch (error) {
      throw error;
    }
  }
  async delete(id: number, user: any): Promise<void> {
    try {
      // Check if the user is trying to update their own profile
      if (Number(id) !== Number(user.userId)) {
        throw new ForbiddenException('You are not allowed to update this user');
      }

      const fetchedUser = await this._usersRepository.findOne({
        where: { id },
      });
      if (!fetchedUser) {
        throw new NotFoundException('User not found');
      }

      await this._usersRepository.remove(fetchedUser);
      const eventValues = {
        id: Number(id),
        role: fetchedUser.role,
        isActive: false,
      };
      this.kafkaClient.emit('user-topic', {
        key: String(user.id),
        value: JSON.stringify(eventValues),
      });
    } catch (error) {
      throw error;
    }
  }
}
