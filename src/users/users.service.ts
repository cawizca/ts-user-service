import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import { hashPassword } from 'src/auth/utils/bycrypt';

export type IUser = {
  id: number;
  email: string;
  password: string;
  role: string;
  isActive?: boolean;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private _usersRepository: Repository<User>
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
    });
    await this._usersRepository.save(user);
    return user;
  }
}
