import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { comparePasswords } from './utils/bycrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private _usersService: UsersService,
    private _jwtService: JwtService,
    private _configService: ConfigService
  ) {}

  /**
   * Validates a user's credentials by checking the provided username and password against stored user data.
   * Retrieves the user from the database, compares the password, and returns user information excluding the password if valid.
   * Returns null if authentication fails.
   *
   * @param {string} username - The username of the user attempting to authenticate.
   * @param {string} pass - The plaintext password provided for authentication.
   *
   * @returns {Promise<any>} Resolves with the user object (excluding password) if credentials are valid, or null if invalid.
   *
   * @throws {Error} Throws if there is an error accessing the user data from the database.
   */
  async validateUser(username: string, pass: string): Promise<any> {
    this.logger.log(`Validating user: ${username}`);
    const user = await this._usersService.findOne(username);
    if (user && user.password === pass) {
      this.logger.log(`User ${username} validated successfully.`);
      const { password, ...result } = user;
      return result;
    }
    this.logger.warn(`User ${username} validation failed.`);
    return null;
  }

  /**
   * Authenticates a user by verifying the provided username and password, generates JWT access and refresh tokens,
   * and returns them upon successful authentication. Handles invalid credentials and unauthorized access attempts.
   *
   * @param {string} username - The username of the user attempting to sign in.
   * @param {string} pass - The plaintext password provided by the user.
   *
   * @returns {Promise<{ access_token: string; refresh_token: string }>} Resolves with an object containing the JWT access and refresh tokens.
   *
   * @throws {UnauthorizedException} Throws if the user does not exist or if the password is invalid.
   */
  async signIn(
    username: string,
    pass: string
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      this.logger.log(`Signing in user: ${username}`);
      const user = await this._usersService.findOne(username);
      if (!user) {
        throw new UnauthorizedException();
      }
      this.logger.log(`User ${username} found.`);
      const isPasswordValid = await comparePasswords(pass, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password provided.');
      }
      this.logger.log(`Password for user ${username} is valid.`);
      const payload = { sub: user.id, email: user.email };
      return {
        access_token: await this._jwtService.signAsync(payload),
        refresh_token: await this._jwtService.signAsync(payload, {
          expiresIn:
            this._configService.get<string>('REFRESH_TOKEN_EXPIRATION') ?? '7d',
          secret: this._configService.get<string>('REFRESH_TOKEN_SECRET') ?? '',
        }),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Registers a new user account with the provided username and password, validates uniqueness,
   * creates the user in the database, and generates JWT access and refresh tokens for authentication.
   * Handles conflict errors if the username is already in use.
   *
   * @param {string} username - The username (typically an email address) to register for the new user.
   * @param {string} pass - The password to associate with the new user account.
   *
   * @returns {Promise<{ access_token: string; refresh_token: string }>} Resolves with the generated access and refresh tokens for the newly created user.
   *
   * @throws {ConflictException} Throws if the provided username is already registered.
   * @throws {Error} Throws if an unexpected error occurs during user creation or token generation.
   */
  async signUp(
    username: string,
    pass: string
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      this.logger.log(`Signing up user: ${username}`);
      const existingUser = await this._usersService.findOne(username);
      if (existingUser) {
        throw new ConflictException('Provided email address cannot be used.');
      }
      this.logger.log(`Creating new user: ${username}`);
      const user = await this._usersService.create(username, pass);
      this.logger.log(`User ${username} created successfully.`);
      const payload = { sub: user.id, email: user.email };
      return {
        access_token: await this._jwtService.signAsync(payload),
        refresh_token: await this._jwtService.signAsync(payload, {
          expiresIn:
            this._configService.get<string>('REFRESH_TOKEN_EXPIRATION') ?? '7d',
          secret: this._configService.get<string>('REFRESH_TOKEN_SECRET') ?? '',
        }),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generates a new access token for the user with the given username.
   *
   * @param {string} username - The username of the user for whom to generate the access token.
   *
   * @returns {Promise<{ access_token: string }>} Resolves with the newly generated access token.
   *
   * @throws {UnauthorizedException} Throws if the user does not exist.
   */
  async generateAccessToken({
    username,
  }: {
    username: string;
  }): Promise<{ access_token: string }> {
    this.logger.log(`Generating access token for user: ${username}`);
    const user = await this._usersService.findOne(username);
    if (!user) {
      throw new UnauthorizedException();
    }
    this.logger.log(`User ${username} found.`);
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this._jwtService.signAsync(payload),
    };
  }
}
