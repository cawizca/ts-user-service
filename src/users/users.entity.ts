import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from './types/users.type';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({ default: true })
  isActive: boolean;
}
