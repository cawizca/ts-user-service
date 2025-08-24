import { ApiProperty, ApiBody } from '@nestjs/swagger';

export class SignInSwagger {
  @ApiProperty({ default: 'kavishka' })
  email: string;

  @ApiProperty({ default: 'kavishka@123' })
  password: string;
}

export class SignUpSwagger {
  @ApiProperty({ default: 'kavishka' })
  email: string;

  @ApiProperty({ default: 'kavishka@123' })
  password: string;
}

export class UsernameDto {
  @ApiProperty({ default: 'kavishka' })
  email: string;
}

export class UserResponseDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    default: { username: 'kavishka', id: 1 },
  })
  user: object;
}
