import { Module } from '@nestjs/common';
import { ActorController } from './actor.controller.js';
import { ActorService } from './actor.service.js';

@Module({
  controllers: [ActorController],
  providers: [ActorService],
})
export class ActorModule {}
