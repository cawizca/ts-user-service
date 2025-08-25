import 'reflect-metadata';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

export class SignInDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  public readonly email: string;

  @IsString()
  @Length(8, 50, { message: 'Password must be between 8 and 50 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  public readonly password: string;
}

export class SignUpDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  public readonly email: string;

  @IsString()
  @Length(8, 50, { message: 'Password must be between 8 and 50 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  public readonly password: string;
}

export class RefreshTokenDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  public readonly email: string;
}
