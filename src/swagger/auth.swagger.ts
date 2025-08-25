import { ApiProperty, ApiBody } from '@nestjs/swagger';

export class SignInSwagger {
  @ApiProperty({ default: 'kavishka@gmail.com' })
  email: string;

  @ApiProperty({ default: 'kavishka@123' })
  password: string;
}

export class SignUpSwagger {
  @ApiProperty({ default: 'kavishka@gmail.com' })
  email: string;

  @ApiProperty({ default: 'kavishka@123' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ default: 'kavishka@gmail.com' })
  email: string;
}

export class UserResponseDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    default: { email: 'kavishka@gmail.com', id: 1 },
  })
  user: object;
}
