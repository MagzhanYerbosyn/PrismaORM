import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto.js';
import { UpdateMovieDto } from './dto/update-movie.dto.js';

@Injectable()
export class MovieService {
  // constructor(
  //   @InjectRepository(MovieEntity)
  //   private readonly movieRepository: Repository<MovieEntity>,
  //   @InjectRepository(ActorEntity)
  //   private readonly actorRepository: Repository<ActorEntity>,
  // ) {}
  // async findAll(): Promise<MovieEntity[]> {
  //   return await this.movieRepository.find({
  //     where: {
  //       isAvailable: true,
  //     },
  //     order: {
  //       createdAt: 'desc',
  //     },
  //     select: {
  //       id: true,
  //       title: true,
  //     },
  //   });
  // }
  // async findById(id: string): Promise<MovieEntity> {
  //   const movie = await this.movieRepository.findOne({
  //     where: {
  //       id,
  //     },
  //     relations: {
  //       actors: true,
  //     },
  //   });
  //   if (!movie) throw new NotFoundException('Фильм не найден');
  //   return movie;
  // }
  // async create(dto: CreateMovieDto): Promise<MovieEntity> {
  //   const { title, releaseYear, actorIds } = dto;
  //   const actors = await this.actorRepository.find({
  //     where: {
  //       id: In(actorIds),
  //     },
  //   });
  //   if (!actors || !actors.length)
  //     throw new NotFoundException('Один или несколько актеров не найдены');
  //   const movie = this.movieRepository.create({
  //     title,
  //     releaseYear,
  //     actors,
  //   });
  //   return this.movieRepository.save(movie);
  // }
  // async update(id: string, dto: UpdateMovieDto): Promise<boolean> {
  //   const movie = await this.findById(id);
  //   Object.assign(movie, dto);
  //   await this.movieRepository.save(movie);
  //   return true;
  // }
  // async delete(id: string): Promise<string> {
  //   const movie = await this.findById(id);
  //   await this.movieRepository.remove(movie);
  //   return movie.id;
  // }
}
