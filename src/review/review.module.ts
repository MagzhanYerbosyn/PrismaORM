import { Module } from '@nestjs/common';
import { MovieService } from '../movie/movie.service.js';
import { ReviewController } from './review.controller.js';
import { ReviewService } from './review.service.js';

@Module({
  controllers: [ReviewController],
  providers: [ReviewService, MovieService],
})
export class ReviewModule {}
