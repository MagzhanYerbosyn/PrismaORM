# Prisma ORM 7 + NestJS: практическое руководство

Руководство описывает настройку и повседневную работу с Prisma ORM 7 в проекте NestJS с PostgreSQL в Docker. В конце есть разделы об отличиях от Prisma 6 и об изменениях в Prisma 8.

---

## Содержание

1. [Версии и требования](#1-версии-и-требования)
2. [Установка](#2-установка)
3. [База данных в Docker](#3-база-данных-в-docker)
4. [Переменные окружения](#4-переменные-окружения)
5. [prisma.config.ts](#5-prismaconfigts)
6. [schema.prisma](#6-schemaprisma)
7. [Миграции и команды CLI](#7-миграции-и-команды-cli)
8. [PrismaService и PrismaModule](#8-prismaservice-и-prismamodule)
9. [CRUD-модуль: пример](#9-crud-модуль-пример)
10. [Обработка ошибок Prisma](#10-обработка-ошибок-prisma)
11. [Запросы: select, include, пагинация, транзакции](#11-запросы-select-include-пагинация-транзакции)
12. [Сиды (seed)](#12-сиды-seed)
13. [Тестирование](#13-тестирование)
14. [Частые ошибки](#14-частые-ошибки)
15. [Prisma 6 → Prisma 7: что изменилось](#15-prisma-6--prisma-7-что-изменилось)
16. [Prisma 8: что нового](#16-prisma-8-что-нового)
17. [Полезные ссылки](#17-полезные-ссылки)

---

## 1. Версии и требования

| Что | Минимум |
|---|---|
| Node.js | 20.19+ |
| TypeScript | 5.4+ |
| PostgreSQL | любая поддерживаемая версия (в примерах 16) |

> ⚠️ **Важно: зафиксируйте версию Prisma 7.**
> Команда `npm install prisma` без версии сейчас ставит **Prisma 8**. Его CLI не читает `schema.prisma` и не знает команд `generate`, `migrate dev` и `db push`. Поэтому указывайте мажорную версию явно:
>
> ```bash
> npm i -D prisma@7
> npm i @prisma/client@7
> ```
>
> В `package.json` версии должны начинаться с `^7` (или быть точными, например `7.10.0`), но не `latest`.

Проверить установленную версию:

```bash
npx prisma -v
```

---

## 2. Установка

В существующем проекте NestJS:

```bash
# CLI (dev-зависимость)
npm i -D prisma@7

# Клиент, драйвер-адаптер для Postgres, загрузка .env
npm i @prisma/client@7 @prisma/adapter-pg dotenv

# Конфиг Nest (если ещё не стоит)
npm i @nestjs/config
```

Инициализация:

```bash
npx prisma init
```

Будут созданы:

```
prisma/
  schema.prisma
prisma.config.ts
.env
```

---

## 3. База данных в Docker

`docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: nest-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DATABASE}
    ports:
      - "${POSTGRES_PORT}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Docker Compose сам подставляет переменные из `.env`, который лежит рядом.

```bash
docker compose up -d      # поднять
docker compose ps         # проверить статус
docker compose down       # остановить
docker compose down -v    # остановить и удалить данные
```

---

## 4. Переменные окружения

`.env`:

```dotenv
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=nest_db

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}?schema=public"
```

### Подстановка `${...}`

Prisma 7 **не загружает `.env` сам**. Его загружает пакет `dotenv`, а он **не раскрывает** `${VAR}` внутри значений. Есть два варианта:

**Вариант 1. Писать значения прямо в строке** (проще всего):

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nest_db?schema=public"
```

**Вариант 2. Подключить `dotenv-expand`:**

```bash
npm i dotenv-expand
```

Тогда подстановку нужно включить в двух местах: в `prisma.config.ts` (раздел 5) и в `ConfigModule` (раздел 8).

> Спецсимволы в пароле (`@`, `#`, `:`, `/`) нужно URL-кодировать, например `@` → `%40`.

Добавьте `.env` в `.gitignore` и держите в репозитории `.env.example` без реальных паролей.

---

## 5. prisma.config.ts

В Prisma 7 строка подключения для CLI задаётся **здесь**, а не в схеме.

```ts
// prisma.config.ts
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { defineConfig, env } from 'prisma/config';

expand(config()); // если не используете ${...}, хватит: import 'dotenv/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

---

## 6. schema.prisma

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
  // url здесь больше НЕ указывается — он в prisma.config.ts
}

enum Role {
  USER
  ADMIN
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId  Int
  createdAt DateTime @default(now())

  @@index([authorId])
  @@map("posts")
}
```

### Почему именно такой генератор

- **`provider = "prisma-client"`**: новый генератор, основной в Prisma 7. Старый `prisma-client-js` устарел.
- **`output` внутри `src`**: если клиент лежит вне `src` (например, `generated/` в корне), `tsc` при сборке Nest переложит файлы в `dist/src/main.js`, и `nest start` не найдёт точку входа.
- **`moduleFormat = "cjs"`**: Nest по умолчанию собирается в CommonJS, а новый генератор без этой опции выдаёт ESM-код.

В `.gitignore`:

```
src/generated
```

---

## 7. Миграции и команды CLI

### Основной цикл работы

```bash
# 1. Изменили schema.prisma
# 2. Создали и применили миграцию
npx prisma migrate dev --name add-posts
# 3. Пересобрали клиент (в Prisma 7 это НЕ происходит автоматически)
npx prisma generate
```

### Справочник команд

| Команда | Что делает | Когда использовать |
|---|---|---|
| `npx prisma migrate dev --name <имя>` | создаёт SQL-миграцию в `prisma/migrations` и применяет её | разработка, основной способ |
| `npx prisma db push` | синхронизирует базу со схемой **без** файлов миграций | быстрые эксперименты, прототипы |
| `npx prisma generate` | генерирует TypeScript-клиент | после **каждого** изменения схемы |
| `npx prisma migrate deploy` | применяет существующие миграции | продакшн, CI, база напарника |
| `npx prisma migrate reset` | удаляет базу, заново применяет миграции | когда база «сломалась» в разработке |
| `npx prisma migrate status` | показывает, какие миграции применены | диагностика |
| `npx prisma db seed` | запускает сид-скрипт | заполнение тестовыми данными |
| `npx prisma studio` | веб-интерфейс для просмотра данных | проверка таблиц и данных |
| `npx prisma format` | форматирует `schema.prisma` | перед коммитом |
| `npx prisma validate` | проверяет схему на ошибки | диагностика |

> Запускайте команды через **`npx`**, а не `npm`: `npm prisma db push` не сработает.

### Скрипты в package.json

```json
{
  "scripts": {
    "db:up": "docker compose up -d",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset",
    "postinstall": "prisma generate"
  }
}
```

`postinstall` генерирует клиент сразу после `npm install`. Это удобно напарникам и в CI, потому что `src/generated` не хранится в git.

### Работа в команде

- Папку `prisma/migrations` **коммитьте**.
- Не редактируйте уже применённые миграции. Нужно что-то поменять — создайте новую.
- Напарник после `git pull` запускает `npx prisma migrate dev` (или `migrate deploy`), затем `npx prisma generate`.

---

## 8. PrismaService и PrismaModule

### ConfigModule

```ts
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true, // раскрывает ${...} в .env
    }),
    PrismaModule,
    UsersModule,
  ],
})
export class AppModule {}
```

### PrismaService

В Prisma 7 клиент подключается к базе **через драйвер-адаптер**, и строку подключения нужно передать ему явно.

```ts
// src/prisma/prisma.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### PrismaModule

```ts
// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

`@Global()` делает `PrismaService` доступным во всех модулях без повторного импорта.

### Структура проекта

```
src/
  generated/prisma/        ← сгенерированный клиент (в .gitignore)
  prisma/
    prisma.module.ts
    prisma.service.ts
  users/
    dto/
      create-user.dto.ts
      update-user.dto.ts
    users.controller.ts
    users.module.ts
    users.service.ts
  app.module.ts
  main.ts
prisma/
  migrations/
  schema.prisma
  seed.ts
prisma.config.ts
```

---

## 9. CRUD-модуль: пример

```bash
npm i class-validator class-transformer @nestjs/mapped-types
```

В `main.ts` включите валидацию:

```ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
```

### DTO

```ts
// src/users/dto/create-user.dto.ts
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;
}
```

```ts
// src/users/dto/update-user.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

### Сервис

```ts
// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateUserDto) {
    return this.prisma.user.create({ data: dto });
  }

  findAll() {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { posts: true },
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  update(id: number, dto: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}
```

### Контроллер

```ts
// src/users/users.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.users.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.users.remove(id);
  }
}
```

### Типы из сгенерированного клиента

```ts
import { Prisma, Role, type User } from '../generated/prisma/client';

// Тип пользователя вместе с постами
type UserWithPosts = Prisma.UserGetPayload<{ include: { posts: true } }>;

// Тип входных данных для create
type UserCreate = Prisma.UserCreateInput;
```

---

## 10. Обработка ошибок Prisma

Без обработки ошибки Prisma превращаются в `500 Internal Server Error`. Глобальный фильтр переводит их в понятные HTTP-ответы.

```ts
// src/prisma/prisma-exception.filter.ts
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '../generated/prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(e: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    const map: Record<string, [number, string]> = {
      P2002: [HttpStatus.CONFLICT, 'Запись с таким значением уже существует'],
      P2003: [HttpStatus.BAD_REQUEST, 'Связанная запись не найдена'],
      P2025: [HttpStatus.NOT_FOUND, 'Запись не найдена'],
    };

    const [status, message] = map[e.code] ?? [HttpStatus.INTERNAL_SERVER_ERROR, 'Ошибка базы данных'];
    res.status(status).json({ statusCode: status, message, code: e.code });
  }
}
```

```ts
// src/main.ts
app.useGlobalFilters(new PrismaExceptionFilter());
```

| Код | Значение |
|---|---|
| `P2002` | нарушение уникальности (`@unique`) |
| `P2003` | нарушение внешнего ключа |
| `P2025` | запись для `update`/`delete` не найдена |

---

## 11. Запросы: select, include, пагинация, транзакции

### select и include

```ts
// Только нужные поля
this.prisma.user.findMany({
  select: { id: true, email: true },
});

// Со связями
this.prisma.user.findUnique({
  where: { id },
  include: { posts: { where: { published: true } } },
});
```

### Фильтры

```ts
this.prisma.post.findMany({
  where: {
    published: true,
    title: { contains: 'nest', mode: 'insensitive' },
    author: { role: 'ADMIN' },
  },
});
```

### Пагинация

```ts
async findPage(page = 1, limit = 10) {
  const [items, total] = await this.prisma.$transaction([
    this.prisma.post.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.post.count(),
  ]);
  return { items, total, page, pages: Math.ceil(total / limit) };
}
```

### Вложенная запись

```ts
this.prisma.user.create({
  data: {
    email: 'a@b.kz',
    posts: { create: [{ title: 'Первый пост' }] },
  },
  include: { posts: true },
});
```

### Интерактивная транзакция

```ts
await this.prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { email } });
  await tx.post.create({ data: { title: 'Welcome', authorId: user.id } });
});
```

Если внутри колбэка выброшено исключение, все изменения откатятся.

### Логирование SQL

```ts
super({ adapter, log: ['query', 'warn', 'error'] });
```

---

## 12. Сиды (seed)

```bash
npm i -D tsx
```

```ts
// prisma/seed.ts
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', name: 'Admin', role: 'ADMIN' },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

Команда сида задаётся в `prisma.config.ts` (`migrations.seed`, см. раздел 5). Запуск:

```bash
npx prisma db seed
```

> В Prisma 7 `migrate dev` и `migrate reset` **не запускают сид автоматически**. Вызывайте его вручную.

---

## 13. Тестирование

### Юнит-тесты: мок PrismaService (Vitest)

```ts
// src/users/users.service.spec.ts
import { Test } from '@nestjs/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(UsersService);
  });

  it('бросает NotFound, если пользователя нет', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(service.findOne(1)).rejects.toThrow('not found');
  });
});
```

### e2e-тесты

- Держите отдельную тестовую базу (`.env.test` с другим `DATABASE_URL`).
- Перед прогоном применяйте миграции: `npx prisma migrate reset --force`.
- Между тестами очищайте таблицы, например `TRUNCATE ... RESTART IDENTITY CASCADE` через `$executeRawUnsafe`.

---

## 14. Частые ошибки

| Симптом | Причина | Решение |
|---|---|---|
| `No flag registered for --datasource-provider`, нет `generate`/`migrate dev` | установлен Prisma 8 | `npm i -D prisma@7 && npm i @prisma/client@7` |
| `Can't reach database server` | контейнер не запущен или неверный порт/хост | `docker compose up -d`, проверить `DATABASE_URL` |
| В ошибке видно `${POSTGRES_USER}` | переменные не раскрылись | `dotenv-expand` / `expandVariables: true` или писать значения напрямую |
| `DATABASE_URL` is undefined в CLI | `.env` не загружен | `import 'dotenv/config'` в `prisma.config.ts` |
| `Cannot find module '../generated/prisma/client'` | клиент не сгенерирован | `npx prisma generate` |
| Типы не видят новое поле | схема изменена, клиент старый | `npx prisma generate`, перезапустить TS-сервер в редакторе |
| `SyntaxError: Cannot use import statement outside a module` | клиент сгенерирован как ESM | `moduleFormat = "cjs"` в генераторе |
| `nest start`: `Cannot find module dist/main` | клиент лежит вне `src` | `output = "../src/generated/prisma"` |
| `The table ... does not exist` | миграции не применены | `npx prisma migrate dev` |
| Drift detected при `migrate dev` | база изменена в обход миграций (например, через `db push`) | в разработке: `npx prisma migrate reset` |
| `npm prisma ...` не работает | запуск не через npx | `npx prisma ...` |

---

## 15. Prisma 6 → Prisma 7: что изменилось

### Сводная таблица

| Тема | Prisma 6 | Prisma 7 |
|---|---|---|
| Генератор | `prisma-client-js` | `prisma-client` (старый устарел) |
| Путь клиента | `node_modules/.prisma`, импорт из `@prisma/client` | обязательный `output`, импорт из своей папки |
| Формат модулей | CommonJS | ESM по умолчанию, `moduleFormat = "cjs"` для CommonJS |
| Движок запросов | бинарный Rust query engine | клиент на TypeScript без Rust-движка |
| Подключение к БД | встроенное в движок | **обязательный драйвер-адаптер** (`@prisma/adapter-pg` и т.д.) |
| URL базы | `url = env("DATABASE_URL")` в `schema.prisma` | `datasource.url` в `prisma.config.ts` |
| `prisma.config.ts` | опционально | основной файл конфигурации |
| Загрузка `.env` | автоматическая | вручную (`import 'dotenv/config'`) |
| `migrate dev` / `db push` | автоматически запускали `generate` | `generate` нужно вызывать отдельно |
| Сид после `migrate dev`/`reset` | запускался автоматически | только `npx prisma db seed` |
| Конфиг сида | `"prisma": { "seed": ... }` в `package.json` | `migrations.seed` в `prisma.config.ts` |
| Middleware `$use` | был (устаревший) | удалён, используйте `$extends` |
| MongoDB | поддерживается | не поддерживается, MongoDB-проекты остаются на v6 |
| Node.js / TS | ниже | Node 20.19+, TypeScript 5.4+ |

### Как это выглядит в коде

**Prisma 6:**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
```

**Prisma 7:**

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
}
```

```ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
```

### Чек-лист миграции с 6 на 7

1. `npm i -D prisma@7 && npm i @prisma/client@7 @prisma/adapter-pg dotenv`
2. Создать `prisma.config.ts` и перенести туда `DATABASE_URL`.
3. Убрать `url` из `datasource` в схеме.
4. Сменить генератор на `prisma-client`, задать `output` (и `moduleFormat = "cjs"` для Nest).
5. Заменить импорты `@prisma/client` на путь к сгенерированному клиенту.
6. Передавать адаптер в `new PrismaClient({ adapter })`.
7. Заменить `$use` на `$extends`, если использовался.
8. Перенести конфиг сида из `package.json` в `prisma.config.ts`.
9. Добавить `prisma generate` в скрипты: после миграций и в `postinstall`.

> Prisma 6 получает только патчи безопасности, и этот период заканчивается 19 ноября 2026 года.

---

## 16. Prisma 8: что нового

Prisma 8 — это **переписанная с нуля** версия ORM на TypeScript. Это не эволюция Prisma 7, а другой подход к работе с данными. Prisma 7 продолжает поддерживаться: исправления ошибок и безопасности выходят ещё 18 месяцев после релиза Prisma 8. Его документация доступна по адресу `/docs/orm/v7`.

### Главные изменения

**1. Контракт вместо схемы и сгенерированного клиента**

- Модели описываются в **контракте**. Это `contract.prisma` на привычном PSL (первая строка обязательно `// use prisma-8`) или контракт на TypeScript.
- Команда `prisma contract emit` превращает контракт в `contract.json` и `contract.d.ts`.
- Вместо `prisma generate` клиент создаётся в рантайме из `contract.json` (файл `src/prisma/db.ts`).
- Под «схемой» в Prisma 8 понимается фактическая структура базы, а не ваш файл.

**2. Новые пакеты**

- `prisma`: CLI версии 8.
- `@prisma/orm-postgres` / `@prisma/orm-mongo`: библиотека рантайма, отдельная для каждой базы.
- `@prisma/client` остаётся на ветке 7 и к Prisma 8 не относится.

**3. Новый CLI**

| Prisma 7 | Prisma 8 |
|---|---|
| `prisma init` создаёт схему | `prisma init` раскладывает инструкции для ИИ-агентов (`.claude`, `.cursor`, `.agents`, `.devin`) |
| — | `prisma orm init --target postgres --authoring psl` настраивает ORM |
| `prisma generate` | `prisma contract emit` |
| `prisma migrate dev` / `db push` | `prisma db init`, `db update`, `migration plan`, `db migrate` |
| — | `prisma db verify`: проверка, что база соответствует контракту |
| — | `prisma db sign`: запись в базе отметки о соответствии контракту |
| URL берётся из конфига | плюс флаг `--db <url>` у команд работы с базой |
| текстовый вывод | `--json` с объектом `envelope` и кодами ошибок вида `NAMESPACE.CODE` |

**4. Новый `prisma.config.ts`**

```ts
import 'dotenv/config';
import { definePrismaConfig } from 'prisma/config';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

export default definePrismaConfig({
  orm: ormConfig({
    contract: './prisma/contract.prisma',
    db: { connection: process.env['DATABASE_URL']! },
  }),
  skills: {
    agents: ['claude', 'cursor'],
  },
});
```

Конфиг разбит на секции: `orm` (контракт, база, миграции), `skills` (инструкции для ИИ-агентов) и `composer` (деплой в Prisma Cloud). Конфиг Prisma 7 без `definePrismaConfig` CLI версии 8 отклонит.

**5. Новый API запросов**

- Запросы пишутся на компонуемом DSL поверх типизированного контракта. Каждый запрос компилируется в план, который можно проверить.
- Уже доступны `$extends`, фильтрация внутри JSON-полей, атомарный `increment`, большинство вложенных записей, уровни изоляции транзакций и коды ошибок в стиле `P2002`.
- Расширения добавляют новые типы данных, первое из них — pgvector.

**6. Базы данных и ограничения**

- Поддерживаются PostgreSQL и **MongoDB** (MongoDB вернулась). MySQL, SQLite и SQL Server пока нет.
- Нет `view`.
- Требования: Node.js 22.18+ (на ветке 24 — 24.11+), TypeScript 5.9+.

**7. Совместная работа с Prisma 7**

```bash
npx prisma@latest orm init --from-prisma7-schema prisma/schema.prisma
```

Команда ставит Prisma 7 рядом под именем `prisma7`. Схема и миграции остаются за Prisma 7 (`npx prisma7 migrate dev`), а Prisma 8 читает ту же `schema.prisma` как контракт. Так приложение можно переводить на новый клиент постепенно, маршрут за маршрутом.

**8. Особенности с NestJS (CommonJS)**

`prisma orm init` переключает `tsconfig.json` на `"module": "preserve"` и может добавить `"type": "module"` в `package.json`. После этого собранное через `tsc` Nest-приложение не запустится. Чтобы вернуть CommonJS:

1. Удалить `"type": "module"` из `package.json`.
2. В `tsconfig.json`: `"module": "nodenext"`, `"moduleResolution": "nodenext"`, `"resolveJsonModule": true`, `"skipLibCheck": true`.
3. В `src/prisma/db.ts` убрать `with { type: 'json' }` из импорта `contract.json`.

### Что выбрать для нового проекта на NestJS

| Prisma 7 | Prisma 8 |
|---|---|
| стабильная, проверенная версия | новая архитектура, API ещё может меняться |
| почти все туториалы, ответы и интеграции написаны под неё | документация и примеры только появляются |
| привычные `schema.prisma`, `generate`, `migrate dev` | контракты, новый CLI, новый API запросов |
| хороший выбор для учебных и командных проектов | хороший выбор, если нужен самый новый стек и время на разбирательство |

---

## 17. Полезные ссылки

- Prisma 7: https://www.prisma.io/docs/orm/v7
- Prisma 8: https://www.prisma.io/docs/orm
- Статус релиза Prisma 8: https://www.prisma.io/docs/orm/release-status
- Переход с Prisma 7 на 8: https://www.prisma.io/docs/guides/upgrade-prisma-orm/postgresql
- NestJS и базы данных: https://docs.nestjs.com/techniques/database
- Коды ошибок Prisma: https://www.prisma.io/docs/orm/reference/error-reference
