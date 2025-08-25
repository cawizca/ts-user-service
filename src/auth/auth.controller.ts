import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { RefreshAuthGuard } from './guard/refresh-auth.guard';
import { Request as Req } from 'express';
import { ApiBody } from '@nestjs/swagger';
import {
  SignInSwagger,
  SignUpSwagger,
  UserResponseDto,
} from 'src/swagger/auth.swagger';
import { RefreshTokenDto, SignInDto, SignUpDto } from './types/auth.type';
import { Roles } from './roles.decorator';
import { Role } from 'src/users/types/users.type';
import { RolesGuard } from './guard/roles.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiBody({ type: SignInSwagger })
  /**
   * Authenticates a user using the provided credentials, logs the attempt, and delegates
   * authentication to the underlying service. Handles error logging and propagates exceptions.
   *
   * @param {SignInDto} signInDto - The data transfer object containing the user's email and password.
   *
   * @returns {Promise<any>} Resolves with the authentication result, which may include tokens or user details.
   *
   * @throws {Error} Throws if authentication fails or an unexpected error occurs during sign-in.
   */
  async signIn(@Body(new ValidationPipe()) signInDto: SignInDto) {
    this.logger.log(`Signing in user: ${signInDto.email}`);
    try {
      return await this.authService.signIn(signInDto.email, signInDto.password);
    } catch (error) {
      this.logger.error(
        `Sign in failed for user: ${signInDto.email}`,
        error.stack
      );
      throw error;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('signup')
  @ApiBody({ type: SignUpSwagger })
  /**
   * Registers a new user using the provided credentials, logs the attempt, and delegates
   * registration to the underlying service. Handles error logging and propagates exceptions.
   *
   * @param {SignUpDto} signUpDto - The data transfer object containing the user's email and password.
   *
   * @returns {Promise<any>} Resolves with the registration result, which may include tokens or user details.
   *
   * @throws {Error} Throws if registration fails or an unexpected error occurs during sign-up.
   */
  async signUp(@Body(new ValidationPipe()) signUpDto: SignUpDto) {
    this.logger.log(`Signing up user: ${signUpDto.email}`);
    try {
      return await this.authService.signUp(signUpDto.email, signUpDto.password);
    } catch (error) {
      this.logger.error(
        `Sign up failed for user: ${signUpDto.email}`,
        error.stack
      );
      throw error;
    }
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  @ApiBody({ type: RefreshTokenDto })
  /**
   * Refreshes the access token for the user with the given email.
   *
   * @param {Request} req - The request object containing the user's email.
   *
   * @returns {Promise<any>} Resolves with the new access token.
   *
   * @throws {Error} Throws if token refresh fails or an unexpected error occurs.
   */
  async getRefreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    this.logger.log(`Refreshing token for user: ${refreshTokenDto.email}`);
    try {
      return await this.authService.generateAccessToken(refreshTokenDto);
    } catch (error) {
      this.logger.error(
        `Token refresh failed for user: ${refreshTokenDto.email}`,
        error.stack
      );
      throw error;
    }
  }

  @Roles(Role.USER, Role.ADMIN)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBody({ type: UserResponseDto })
  /**
   * Retrieves the profile information for the authenticated user.
   *
   * @param {Request} req - The request object containing the user's information.
   *
   * @returns {Promise<any>} Resolves with the user's profile information.
   *
   * @throws {Error} Throws if fetching the profile fails or an unexpected error occurs.
   */
  async getProfile(@Request() req: Req) {
    this.logger.log(`Fetching profile for user: ${req.user}`);
    try {
      return req.user;
    } catch (error) {
      this.logger.error(
        `Fetching profile failed for user: ${req.user}`,
        error.stack
      );
      throw error;
    }
  }
}
