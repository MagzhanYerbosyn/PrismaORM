import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovieService } from '../movie/movie.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';

@Injectable()
export class ReviewService {
  // constructor(
  //   @InjectRepository(ReviewEntity)
  //   private readonly reviewRepository: Repository<ReviewEntity>,
  //   private readonly movieService: MovieService,
  // ) {}
  // async create(dto: CreateReviewDto): Promise<ReviewEntity> {
  //   const { movieId, text, rating } = dto;
  //   const movie = await this.movieService.findById(movieId);
  //   const review = this.reviewRepository.create({
  //     text,
  //     rating,
  //     movie,
  //   });
  //   return await this.reviewRepository.save(review);
  // }
}
