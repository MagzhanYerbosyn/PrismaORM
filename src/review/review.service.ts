import { Injectable } from '@nestjs/common';
import { Review } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';

@Injectable()
export class ReviewService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(dto: CreateReviewDto): Promise<Review> {
    const { movieId, text, rating } = dto;

    const review = this.prismaService.review.create({
      data: {
        text,
        rating,
        movie: {
          connect: {
            id: movieId,
          },
        },
      },
    });

    return review;
  }
}
