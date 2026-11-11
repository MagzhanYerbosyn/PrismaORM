import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto.js';
import { MovieService } from './movie.service.js';

@Controller({
  path: 'movies',
})
export class MovieController {
  constructor(private readonly movieService: MovieService) {}
  @Get()
  findAll() {
    return this.movieService.findAll();
  }
  // @Get(':id')
  // findById(@Param('id') id: string) {
  //   return this.movieService.findById(id);
  // }

  @Post()
  create(@Body() dto: CreateMovieDto) {
    return this.movieService.create(dto);
  }

  // @Put(':id')
  // update(@Param('id') id: string, @Body() dto: UpdateMovieDto) {
  //   return this.movieService.update(id, dto);
  // }
  // @Delete(':id')
  // delete(@Param('id') id: string) {
  //   return this.movieService.delete(id);
  // }
}
