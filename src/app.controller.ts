import { Body, Controller, Get, Post, UsePipes } from '@nestjs/common';
import { AppService } from './app.service.js';
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
}
