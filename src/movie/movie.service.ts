import { Injectable, NotFoundException } from '@nestjs/common';
import { Movie } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateMovieDto } from './dto/create-movie.dto.js';
import { UpdateMovieDto } from './dto/update-movie.dto.js';

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

  async findById(id: string): Promise<Movie> {
    const movie = await this.prismaService.movie.findUnique({
      where: {
        id,
      },
      include: {
        actors: true,
        moviePoster: true,
      },
    });

    if (!movie || !movie.isAvailable)
      throw new NotFoundException('Фильм не найден');

    return movie;
  }

  async create(dto: CreateMovieDto): Promise<Movie> {
    const { title, releaseYear, actorIds, imageUrl } = dto;

    const actors = await this.prismaService.actor.findMany({
      where: {
        id: {
          in: actorIds,
        },
      },
    });

    if (!actors || !actors.length)
      throw new NotFoundException('Один или несколько актеров не найдены');

    const movie = this.prismaService.movie.create({
      data: {
        title,
        releaseYear,
        moviePoster: imageUrl
          ? {
              create: {
                url: imageUrl,
              },
            }
          : undefined,
        actors: {
          connect: actors.map((actor) => ({
            id: actor.id,
          })),
        },
      },
    });

    return movie;
  }

  async update(id: string, dto: UpdateMovieDto): Promise<boolean> {
    const movie = await this.findById(id);

    const actors = await this.prismaService.actor.findMany({
      where: {
        id: {
          in: dto.actorIds,
        },
      },
    });

    if (!actors || !actors.length)
      throw new NotFoundException('Один или несколько актеров не найдены');

    await this.prismaService.movie.update({
      where: {
        id: movie.id,
      },
      data: {
        title: dto.title,
        releaseYear: dto.releaseYear,
        moviePoster: dto.imageUrl
          ? {
              create: {
                url: dto.imageUrl,
              },
            }
          : undefined,
        actors: {
          connect: actors.map((actor) => ({
            id: actor.id,
          })),
        },
      },
    });

    return true;
  }

  // async delete(id: string): Promise<string> {
  //   const movie = await this.findById(id);
  //   await this.movieRepository.remove(movie);
  //   return movie.id;
  // }
}
