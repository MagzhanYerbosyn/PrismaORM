import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActorModule } from './actor/actor.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MovieModule } from './movie/movie.module.js';
import { ReviewModule } from './review/review.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MovieModule,
    ReviewModule,
    ActorModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
