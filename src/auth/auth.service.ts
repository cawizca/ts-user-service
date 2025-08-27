import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { comparePasswords } from './utils/bycrypt';
import { ConfigService } from '@nestjs/config';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private _usersService: UsersService,
    private _jwtService: JwtService,
    private _configService: ConfigService,
    @Inject('USER_SERVICE') private readonly kafkaClient: ClientKafka
  ) {}

  /**
   * Validates a user's credentials by checking the provided email and password against stored user data.
   * Retrieves the user from the database, compares the password, and returns user information excluding the password if valid.
   * Returns null if authentication fails.
   *
   * @param {string} email - The email of the user attempting to authenticate.
   * @param {string} pass - The plaintext password provided for authentication.
   *
   * @returns {Promise<any>} Resolves with the user object (excluding password) if credentials are valid, or null if invalid.
   *
   * @throws {Error} Throws if there is an error accessing the user data from the database.
   */
  async validateUser(email: string, pass: string): Promise<any> {
    this.logger.log(`Validating user: ${email}`);
    const user = await this._usersService.findOne(email);
    if (user && user.password === pass) {
      this.logger.log(`User ${email} validated successfully.`);
      const { password, ...result } = user;
      return result;
    }
    this.logger.warn(`User ${email} validation failed.`);
    return null;
  }

  /**
   * Authenticates a user by verifying the provided email and password, generates JWT access and refresh tokens,
   * and returns them upon successful authentication. Handles invalid credentials and unauthorized access attempts.
   *
   * @param {string} email - The email of the user attempting to sign in.
   * @param {string} pass - The plaintext password provided by the user.
   *
   * @returns {Promise<{ access_token: string; refresh_token: string }>} Resolves with an object containing the JWT access and refresh tokens.
   *
   * @throws {UnauthorizedException} Throws if the user does not exist or if the password is invalid.
   */
  async signIn(
    email: string,
    pass: string
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      this.logger.log(`Signing in user: ${email}`);
      const user = await this._usersService.findOne(email);
      if (!user) {
        throw new UnauthorizedException('Invalid email or password provided.');
      }
      this.logger.log(`User ${email} found.`);
      const isPasswordValid = await comparePasswords(pass, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password provided.');
      }
      this.logger.log(`Password for user ${email} is valid.`);
      const payload = { sub: user.id, email: user.email, role: user.role };

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
   * Registers a new user account with the provided email and password, validates uniqueness,
   * creates the user in the database, and generates JWT access and refresh tokens for authentication.
   * Handles conflict errors if the email is already in use.
   *
   * @param {string} email - The email  to register for the new user.
   * @param {string} pass - The password to associate with the new user account.
   *
   * @returns {Promise<{ access_token: string; refresh_token: string }>} Resolves with the generated access and refresh tokens for the newly created user.
   *
   * @throws {ConflictException} Throws if the provided email is already registered.
   * @throws {Error} Throws if an unexpected error occurs during user creation or token generation.
   */
  async signUp(
    email: string,
    pass: string
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      this.logger.log(`Signing up user: ${email}`);
      const existingUser = await this._usersService.findOne(email);
      if (existingUser) {
        throw new ConflictException('Provided email address cannot be used.');
      }
      this.logger.log(`Creating new user: ${email}`);
      const user = await this._usersService.create(email, pass);
      this.logger.log(`User ${email} created successfully.`);
      const payload = { sub: user.id, email: user.email, role: user.role };
      const eventValues = {
        id: user.id,
        role: user.role,
        isActive: user.isActive,
      };
      this.kafkaClient.emit('user-topic', {
        key: String(user.id),
        value: JSON.stringify(eventValues),
      });
      this.logger.log(`Emitted user creation event for: ${email}`);
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
   * Generates a new access token for the user with the given email.
   *
   * @param {string} email - The email of the user for whom to generate the access token.
   *
   * @returns {Promise<{ access_token: string }>} Resolves with the newly generated access token.
   *
   * @throws {UnauthorizedException} Throws if the user does not exist.
   */
  async generateAccessToken({
    email,
  }: {
    email: string;
  }): Promise<{ access_token: string }> {
    this.logger.log(`Generating access token for user: ${email}`);
    const user = await this._usersService.findOne(email);
    if (!user) {
      throw new UnauthorizedException();
    }
    this.logger.log(`User ${email} found.`);
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this._jwtService.signAsync(payload),
    };
  }

  /**
   * Validates the user's role based on the provided payload.
   *
   * This method retrieves the user by email and checks if the user's role matches
   * the role specified in the payload. If the user does not exist or the roles do not match,
   * an `UnauthorizedException` is thrown.
   *
   * @param payload - An object containing user identification and role information.
   * @returns An object containing the user's ID, email, and role if validation succeeds.
   * @throws {UnauthorizedException} If the user is not found or the role does not match.
   */
  async validateUserRole(payload: any) {
    const user = await this._usersService.findOne(payload.email);
    if (!user || user.role !== payload.role) {
      throw new UnauthorizedException('Unauthorized access.');
    }
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
