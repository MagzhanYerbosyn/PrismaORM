import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MovieService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll() {
    return await this.prismaService.movie.findMany({
      where: {
        isAvailable: true,
      },
      orderBy: {
        createAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        actors: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

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
