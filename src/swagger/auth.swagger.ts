import { ApiProperty, ApiBody } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  password: string;
}

export class SignUpDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  password: string;
}

export class UsernameDto {
  @ApiProperty()
  username: string;
}

export class UserResponseDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  user: object;
}
