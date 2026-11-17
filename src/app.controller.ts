import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AppService } from './app.service.js';
import { UserAgent } from './common/decorators/user-agent.decorator.js';
import { AuthGuard } from './common/guards/auth.guard.js';
import { StringToLowercasePipe } from './common/pipes/string-to-lowercase.pipe.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @UsePipes(StringToLowercasePipe)
  @Post()
  create(@Body('title') title: string) {
    return title;
  }

  @UseGuards(AuthGuard)
  @Get('@me')
  getProfile(@UserAgent() userAgent: string) {
    return {
      id: 1,
      username: 'asd',
      email: 'asd@gmail.com',
      userAgent,
    };
  }
}
