import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ActorService } from './actor.service.js';
import { CreateActorDto } from './dto/create-actor.dto.js';

@ApiTags('Actor')
@Controller('actors')
export class ActorController {
  constructor(private readonly actorService: ActorService) {}

  @Post()
  create(@Body() dto: CreateActorDto) {
    return this.actorService.create(dto);
  }
}
