import { Body, Controller, Post } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { ReviewService } from './review.service.js';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  create(@Body() dto: CreateReviewDto) {
    return this.reviewService.create(dto);
  }
}
