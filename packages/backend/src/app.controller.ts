import { Controller, Get, Post, Body, Redirect } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

@Controller()
export class AppController {
  @Get()
  @Redirect('/api', 302)
  redirectRoot(): void {
    return;
  }

  @Post('users')
  createUser(@Body() createUserDto: CreateUserDto) {
    return {
      message: 'Usuário criado com sucesso',
      data: createUserDto,
    };
  }
}
