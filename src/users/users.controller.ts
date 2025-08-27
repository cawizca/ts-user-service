import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from './types/users.type';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Request as Req } from 'express';
import { UsersService } from './users.service';
import { User } from 'src/auth/auth.decorator';
import { ApiBody } from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private _usersService: UsersService) {}

  @Roles(Role.USER, Role.ADMIN)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  async getUserProfile(@Param('id') id: number, @User() user: any) {
    this.logger.log(`Fetching profile for user: ${user.email}`);
    try {
      const foundUser = await this._usersService.findById(id);
      return foundUser;
    } catch (error) {
      this.logger.error(
        `Fetching profile failed for user: ${user.email}`,
        error.stack
      );
      throw error;
    }
  }

  @Roles(Role.USER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  async updateUserProfile(
    @Param('id') id: number,
    @Body() updateUserDto: any,
    @User() user: any
  ) {
    this.logger.log(`Updating profile for user: ${user.email}`);
    try {
      const updatedUser = await this._usersService.update(
        id,
        updateUserDto.email,
        updateUserDto.password,
        user
      );
      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Updating profile failed for user: ${user.email}`,
        error.stack
      );
      throw error;
    }
  }

  @Roles(Role.USER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  async deleteUserProfile(@Param('id') id: number, @User() user: any) {
    this.logger.log(`Deleting profile for user: ${user.email}`);
    try {
      await this._usersService.delete(id, user);
      return { message: 'User deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Deleting profile failed for user: ${user.email}`,
        error.stack
      );
      throw error;
    }
  }
}
