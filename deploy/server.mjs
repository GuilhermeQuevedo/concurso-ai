import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);

// apps/backend/src/server.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit2 from "express-rate-limit";
import path3 from "node:path";
import fs5 from "node:fs";
import { execSync } from "node:child_process";

// apps/backend/src/config/env.ts
import { z } from "zod";
var envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  AI_PROVIDER: z.enum(["gemini", "ollama", "mock"]).default("mock"),
  GEMINI_API_KEY: z.string().optional(),
  OLLAMA_URL: z.string().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("qwen2.5:14b"),
  REQUIRE_SUBSCRIPTION: z.string().default("false").transform((v) => v === "true"),
  KIWIFY_WEBHOOK_TOKEN: z.string().optional(),
  KIWIFY_CHECKOUT_URL: z.string().default("")
});
function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}
var env = loadEnv();

// apps/backend/src/routes/index.ts
import { Router as Router16 } from "express";

// apps/backend/src/routes/auth.routes.ts
import { Router } from "express";
import rateLimit from "express-rate-limit";

// packages/shared/src/constants.ts
var AUTH = {
  ACCESS_TOKEN_EXPIRY: "15m",
  REFRESH_TOKEN_EXPIRY_DAYS: 7,
  BCRYPT_SALT_ROUNDS: 12
};
var RATE_LIMIT = {
  GENERAL_WINDOW_MS: 60 * 1e3,
  GENERAL_MAX: 100,
  AUTH_WINDOW_MS: 60 * 1e3,
  AUTH_MAX: 10
};

// apps/backend/src/middlewares/error-handler.ts
import { ZodError } from "zod";
var AppError = class extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = "AppError";
  }
  statusCode;
  code;
};
function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code }
    });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        message: err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
        code: "VALIDATION_ERROR"
      }
    });
    return;
  }
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: { message: "Internal server error", code: "INTERNAL_ERROR" }
  });
}

// apps/backend/src/utils/request.ts
function getUserId(req) {
  if (!req.userId) {
    throw new AppError(401, "UNAUTHORIZED", "Usu\xE1rio n\xE3o autenticado");
  }
  return req.userId;
}

// apps/backend/src/controllers/auth.controller.ts
var AuthController = class {
  constructor(authService2) {
    this.authService = authService2;
  }
  authService;
  register = async (req, res, next) => {
    try {
      const dto = req.body;
      const tokens = await this.authService.register(dto);
      res.status(201).json({ success: true, data: tokens });
    } catch (error) {
      next(error);
    }
  };
  login = async (req, res, next) => {
    try {
      const dto = req.body;
      const tokens = await this.authService.login(dto);
      res.json({ success: true, data: tokens });
    } catch (error) {
      next(error);
    }
  };
  refresh = async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      const tokens = await this.authService.refresh(refreshToken);
      res.json({ success: true, data: tokens });
    } catch (error) {
      next(error);
    }
  };
  logout = async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      await this.authService.logout(refreshToken);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  };
  profile = async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const profile = await this.authService.getProfile(userId);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  };
};

// apps/backend/src/services/auth.service.ts
import bcrypt from "bcrypt";

// apps/backend/src/utils/jwt.ts
import { SignJWT, jwtVerify } from "jose";
var secret = new TextEncoder().encode(env.JWT_SECRET);
var ALGORITHM = "HS256";
async function generateAccessToken(payload) {
  return new SignJWT({ userId: payload.userId, role: payload.role }).setProtectedHeader({ alg: ALGORITHM }).setIssuedAt().setExpirationTime("15m").sign(secret);
}
async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, secret);
  return {
    userId: payload.userId,
    role: payload.role
  };
}
function generateRefreshToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// apps/backend/src/services/auth.service.ts
var AuthService = class {
  constructor(authRepository2) {
    this.authRepository = authRepository2;
  }
  authRepository;
  async register(dto) {
    const existing = await this.authRepository.findUserByEmail(dto.email);
    if (existing) {
      throw new AppError(409, "EMAIL_EXISTS", "E-mail j\xE1 cadastrado");
    }
    const hashedPassword = await bcrypt.hash(dto.password, AUTH.BCRYPT_SALT_ROUNDS);
    const user = await this.authRepository.createUser({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword
    });
    return this.createTokens(user.id, user.role);
  }
  async login(dto) {
    const user = await this.authRepository.findUserByEmail(dto.email);
    if (!user) {
      throw new AppError(401, "INVALID_CREDENTIALS", "E-mail ou senha inv\xE1lidos");
    }
    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new AppError(401, "INVALID_CREDENTIALS", "E-mail ou senha inv\xE1lidos");
    }
    return this.createTokens(user.id, user.role);
  }
  async refresh(refreshToken) {
    const session = await this.authRepository.findSessionByToken(refreshToken);
    if (!session) {
      throw new AppError(401, "INVALID_TOKEN", "Refresh token inv\xE1lido");
    }
    if (session.expiresAt < /* @__PURE__ */ new Date()) {
      await this.authRepository.deleteSession(session.id);
      throw new AppError(401, "TOKEN_EXPIRED", "Refresh token expirado");
    }
    await this.authRepository.deleteSession(session.id);
    const user = await this.authRepository.findUserById(session.userId);
    if (!user) {
      throw new AppError(401, "USER_NOT_FOUND", "Usu\xE1rio n\xE3o encontrado");
    }
    return this.createTokens(user.id, user.role);
  }
  async logout(refreshToken) {
    const session = await this.authRepository.findSessionByToken(refreshToken);
    if (session) {
      await this.authRepository.deleteSession(session.id);
    }
  }
  async getProfile(userId) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "Usu\xE1rio n\xE3o encontrado");
    }
    const { password, ...profile } = user;
    void password;
    return profile;
  }
  async validateToken(token) {
    return verifyAccessToken(token);
  }
  async createTokens(userId, role) {
    const accessToken = await generateAccessToken({ userId, role });
    const refreshTokenValue = generateRefreshToken();
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + AUTH.REFRESH_TOKEN_EXPIRY_DAYS);
    await this.authRepository.createSession({
      userId,
      refreshToken: refreshTokenValue,
      expiresAt
    });
    return { accessToken, refreshToken: refreshTokenValue };
  }
};

// apps/backend/src/database/prisma.ts
import { PrismaClient } from "@prisma/client";
var globalForPrisma = globalThis;
var prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
});
if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// apps/backend/src/repositories/auth.repository.ts
var AuthRepository = class {
  async findUserByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }
  async findUserById(id) {
    return prisma.user.findUnique({ where: { id } });
  }
  async createUser(data) {
    return prisma.user.create({ data });
  }
  async createSession(data) {
    return prisma.session.create({ data });
  }
  async findSessionByToken(refreshToken) {
    return prisma.session.findUnique({ where: { refreshToken } });
  }
  async deleteSession(id) {
    await prisma.session.delete({ where: { id } });
  }
  async deleteAllUserSessions(userId) {
    await prisma.session.deleteMany({ where: { userId } });
  }
};

// apps/backend/src/middlewares/validate.ts
function validate(schema) {
  return (req, _res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}
function validateRequest(schema) {
  return (req, _res, next) => {
    try {
      const result = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query
      });
      if (result.body) {
        req.body = result.body;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

// apps/backend/src/middlewares/auth.middleware.ts
async function authMiddleware(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AppError(401, "MISSING_TOKEN", "Token de autentica\xE7\xE3o n\xE3o fornecido");
    }
    const token = header.slice(7);
    const payload = await verifyAccessToken(token);
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(401, "INVALID_TOKEN", "Token inv\xE1lido ou expirado"));
  }
}

// apps/backend/src/validators/auth.validators.ts
import { z as z2 } from "zod";
var registerSchema = z2.object({
  name: z2.string().min(2).max(100),
  email: z2.string().email(),
  phone: z2.string().min(10).max(20),
  password: z2.string().min(8).max(100)
});
var loginSchema = z2.object({
  email: z2.string().email(),
  password: z2.string().min(1)
});
var refreshSchema = z2.object({
  refreshToken: z2.string().min(1)
});

// apps/backend/src/routes/auth.routes.ts
var authRepository = new AuthRepository();
var authService = new AuthService(authRepository);
var authController = new AuthController(authService);
var authLimiter = rateLimit({
  windowMs: RATE_LIMIT.AUTH_WINDOW_MS,
  max: RATE_LIMIT.AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false
});
var router = Router();
router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post("/logout", validate(refreshSchema), authController.logout);
router.get("/profile", authMiddleware, authController.profile);

// apps/backend/src/routes/subject.routes.ts
import { Router as Router2 } from "express";

// apps/backend/src/repositories/subject.repository.ts
var SubjectRepository = class {
  async findAll() {
    return prisma.subject.findMany({
      include: { children: { orderBy: { order: "asc" } } },
      where: { parentId: null },
      orderBy: { order: "asc" }
    });
  }
  async findById(id) {
    return prisma.subject.findUnique({
      where: { id },
      include: { children: { orderBy: { order: "asc" } }, parent: true }
    });
  }
  async findByParentId(parentId) {
    return prisma.subject.findMany({
      where: { parentId },
      orderBy: { order: "asc" }
    });
  }
  async create(data) {
    return prisma.subject.create({ data });
  }
  async update(id, data) {
    return prisma.subject.update({ where: { id }, data });
  }
  async delete(id) {
    await prisma.subject.delete({ where: { id } });
  }
  async hasChildren(id) {
    const count = await prisma.subject.count({ where: { parentId: id } });
    return count > 0;
  }
};

// apps/backend/src/services/subject.service.ts
var SubjectService = class {
  constructor(repository3) {
    this.repository = repository3;
  }
  repository;
  async getAll() {
    return this.repository.findAll();
  }
  async getById(id) {
    const subject = await this.repository.findById(id);
    if (!subject) {
      throw new AppError(404, "SUBJECT_NOT_FOUND", "Disciplina n\xE3o encontrada");
    }
    return subject;
  }
  async getByParentId(parentId) {
    return this.repository.findByParentId(parentId);
  }
  async create(data) {
    if (data.parentId) {
      const parent = await this.repository.findById(data.parentId);
      if (!parent) {
        throw new AppError(404, "PARENT_NOT_FOUND", "Disciplina pai n\xE3o encontrada");
      }
    }
    return this.repository.create(data);
  }
  async update(id, data) {
    await this.getById(id);
    if (data.parentId) {
      if (data.parentId === id) {
        throw new AppError(400, "SELF_REFERENCE", "Disciplina n\xE3o pode ser pai de si mesma");
      }
      const parent = await this.repository.findById(data.parentId);
      if (!parent) {
        throw new AppError(404, "PARENT_NOT_FOUND", "Disciplina pai n\xE3o encontrada");
      }
    }
    return this.repository.update(id, data);
  }
  async delete(id) {
    await this.getById(id);
    const hasChildren = await this.repository.hasChildren(id);
    if (hasChildren) {
      throw new AppError(400, "HAS_CHILDREN", "N\xE3o \xE9 poss\xEDvel excluir disciplina com subdisciplinas");
    }
    await this.repository.delete(id);
  }
};

// apps/backend/src/controllers/subject.controller.ts
var SubjectController = class {
  constructor(service15) {
    this.service = service15;
  }
  service;
  getAll = async (_req, res, next) => {
    try {
      const subjects = await this.service.getAll();
      const response = { success: true, data: subjects };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  getById = async (req, res, next) => {
    try {
      const subject = await this.service.getById(req.params.id);
      const response = { success: true, data: subject };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  create = async (req, res, next) => {
    try {
      const subject = await this.service.create(req.body);
      const response = { success: true, data: subject };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  update = async (req, res, next) => {
    try {
      const subject = await this.service.update(req.params.id, req.body);
      const response = { success: true, data: subject };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  delete = async (req, res, next) => {
    try {
      await this.service.delete(req.params.id);
      const response = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
};

// apps/backend/src/validators/subject.validators.ts
import { z as z3 } from "zod";
var createSubjectSchema = z3.object({
  body: z3.object({
    name: z3.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(200),
    parentId: z3.string().min(1).nullable().optional(),
    order: z3.number().int().min(0).optional()
  })
});
var updateSubjectSchema = z3.object({
  body: z3.object({
    name: z3.string().min(2).max(200).optional(),
    parentId: z3.string().min(1).nullable().optional(),
    order: z3.number().int().min(0).optional()
  }),
  params: z3.object({
    id: z3.string().min(1)
  })
});
var subjectParamsSchema = z3.object({
  params: z3.object({
    id: z3.string().min(1)
  })
});

// apps/backend/src/routes/subject.routes.ts
var router2 = Router2();
var repository = new SubjectRepository();
var service = new SubjectService(repository);
var controller = new SubjectController(service);
router2.get("/", authMiddleware, controller.getAll);
router2.get("/:id", authMiddleware, validateRequest(subjectParamsSchema), controller.getById);
router2.post("/", authMiddleware, validateRequest(createSubjectSchema), controller.create);
router2.put("/:id", authMiddleware, validateRequest(updateSubjectSchema), controller.update);
router2.delete("/:id", authMiddleware, validateRequest(subjectParamsSchema), controller.delete);

// apps/backend/src/routes/exam-board.routes.ts
import { Router as Router3 } from "express";

// apps/backend/src/repositories/exam-board.repository.ts
var ExamBoardRepository = class {
  async findAll() {
    return prisma.examBoard.findMany({ orderBy: { name: "asc" } });
  }
  async findById(id) {
    return prisma.examBoard.findUnique({ where: { id } });
  }
  async findBySlug(slug) {
    return prisma.examBoard.findUnique({ where: { slug } });
  }
  async create(data) {
    return prisma.examBoard.create({ data });
  }
  async update(id, data) {
    return prisma.examBoard.update({ where: { id }, data });
  }
  async delete(id) {
    await prisma.examBoard.delete({ where: { id } });
  }
};

// apps/backend/src/utils/slugify.ts
function slugify(text) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// apps/backend/src/services/exam-board.service.ts
var ExamBoardService = class {
  constructor(repository3) {
    this.repository = repository3;
  }
  repository;
  async getAll() {
    return this.repository.findAll();
  }
  async getById(id) {
    const board = await this.repository.findById(id);
    if (!board) {
      throw new AppError(404, "EXAM_BOARD_NOT_FOUND", "Banca n\xE3o encontrada");
    }
    return board;
  }
  async create(data) {
    const slug = slugify(data.name);
    const existing = await this.repository.findBySlug(slug);
    if (existing) {
      throw new AppError(409, "EXAM_BOARD_EXISTS", "Banca j\xE1 existe");
    }
    return this.repository.create({ name: data.name, slug });
  }
  async update(id, data) {
    await this.getById(id);
    const updateData = {};
    if (data.name) {
      updateData.name = data.name;
      updateData.slug = slugify(data.name);
      const existing = await this.repository.findBySlug(updateData.slug);
      if (existing && existing.id !== id) {
        throw new AppError(409, "EXAM_BOARD_EXISTS", "Banca com este nome j\xE1 existe");
      }
    }
    return this.repository.update(id, updateData);
  }
  async delete(id) {
    await this.getById(id);
    await this.repository.delete(id);
  }
};

// apps/backend/src/controllers/exam-board.controller.ts
var ExamBoardController = class {
  constructor(service15) {
    this.service = service15;
  }
  service;
  getAll = async (_req, res, next) => {
    try {
      const boards = await this.service.getAll();
      const response = { success: true, data: boards };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  getById = async (req, res, next) => {
    try {
      const board = await this.service.getById(req.params.id);
      const response = { success: true, data: board };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  create = async (req, res, next) => {
    try {
      const board = await this.service.create(req.body);
      const response = { success: true, data: board };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  update = async (req, res, next) => {
    try {
      const board = await this.service.update(req.params.id, req.body);
      const response = { success: true, data: board };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  delete = async (req, res, next) => {
    try {
      await this.service.delete(req.params.id);
      const response = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
};

// apps/backend/src/validators/exam-board.validators.ts
import { z as z4 } from "zod";
var createExamBoardSchema = z4.object({
  body: z4.object({
    name: z4.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100)
  })
});
var updateExamBoardSchema = z4.object({
  body: z4.object({
    name: z4.string().min(2).max(100).optional()
  }),
  params: z4.object({
    id: z4.string().min(1)
  })
});
var examBoardParamsSchema = z4.object({
  params: z4.object({
    id: z4.string().min(1)
  })
});

// apps/backend/src/routes/exam-board.routes.ts
var router3 = Router3();
var repository2 = new ExamBoardRepository();
var service2 = new ExamBoardService(repository2);
var controller2 = new ExamBoardController(service2);
router3.get("/", authMiddleware, controller2.getAll);
router3.get("/:id", authMiddleware, validateRequest(examBoardParamsSchema), controller2.getById);
router3.post("/", authMiddleware, validateRequest(createExamBoardSchema), controller2.create);
router3.put("/:id", authMiddleware, validateRequest(updateExamBoardSchema), controller2.update);
router3.delete("/:id", authMiddleware, validateRequest(examBoardParamsSchema), controller2.delete);

// apps/backend/src/routes/question.routes.ts
import { Router as Router4 } from "express";

// apps/backend/src/services/document.service.ts
import fs from "node:fs/promises";
import { PDFParse } from "pdf-parse";

// apps/backend/src/middlewares/upload.ts
import multer from "multer";
import path from "node:path";
import crypto2 from "node:crypto";
var UPLOAD_DIR = path.resolve("uploads");
var MAX_FILE_SIZE = 10 * 1024 * 1024;
var ALLOWED_MIMES = {
  "application/pdf": "PDF",
  "text/plain": "TXT",
  "text/markdown": "MARKDOWN",
  "text/html": "HTML"
};
var storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto2.randomUUID()}${ext}`);
  }
});
var upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES[file.mimetype]) {
      cb(new AppError(400, "INVALID_FILE_TYPE", "Tipo de arquivo n\xE3o suportado. Use PDF, TXT, MD ou HTML."));
      return;
    }
    cb(null, true);
  }
});
function mimeToDocType(mime) {
  return ALLOWED_MIMES[mime] ?? "TXT";
}

// apps/backend/src/utils/text-encoding.ts
function decodeTextBuffer(buffer) {
  const utf8 = buffer.toString("utf-8");
  if (utf8.includes("\uFFFD")) {
    return buffer.toString("latin1");
  }
  return utf8;
}

// apps/backend/src/services/document.service.ts
var DocumentService = class {
  async upload(userId, file, subjectId) {
    if (subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject) {
        throw new AppError(404, "SUBJECT_NOT_FOUND", "Disciplina n\xE3o encontrada");
      }
    }
    const content = await this.extractText(file);
    const docType = mimeToDocType(file.mimetype);
    const document = await prisma.document.create({
      data: {
        userId,
        name: file.originalname,
        type: docType,
        content,
        subjectId: subjectId ?? null
      }
    });
    await fs.unlink(file.path).catch(() => {
    });
    return document;
  }
  async list(userId, subjectId) {
    return prisma.document.findMany({
      where: { userId, ...subjectId ? { subjectId } : {} },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        type: true,
        subjectId: true,
        createdAt: true,
        content: false
      }
    });
  }
  async getById(userId, id) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc || doc.userId !== userId) {
      throw new AppError(404, "DOCUMENT_NOT_FOUND", "Documento n\xE3o encontrado");
    }
    return doc;
  }
  async delete(userId, id) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc || doc.userId !== userId) {
      throw new AppError(404, "DOCUMENT_NOT_FOUND", "Documento n\xE3o encontrado");
    }
    await prisma.document.delete({ where: { id } });
  }
  async getContentBySubject(subjectId, maxChars = 8e3) {
    const docs = await prisma.document.findMany({
      where: { subjectId },
      orderBy: { createdAt: "desc" },
      select: { content: true, name: true },
      take: 5
    });
    if (docs.length === 0) return "";
    let combined = "";
    for (const doc of docs) {
      const chunk = `--- ${doc.name} ---
${doc.content}

`;
      if (combined.length + chunk.length > maxChars) {
        combined += chunk.slice(0, maxChars - combined.length);
        break;
      }
      combined += chunk;
    }
    return combined;
  }
  async extractText(file) {
    if (file.mimetype === "application/pdf") {
      const data = await fs.readFile(file.path);
      const parser = new PDFParse({ data: new Uint8Array(data) });
      await parser.load();
      const result = await parser.getText();
      return result.text.trim();
    }
    const buffer = await fs.readFile(file.path);
    return decodeTextBuffer(buffer).trim();
  }
};

// apps/backend/src/utils/html.ts
function htmlToPlainText(input) {
  if (!input) return "";
  return input.replace(/<\s*br\s*\/?\s*>/gi, "\n").replace(/<\s*\/\s*(p|div|li|tr)\s*>/gi, "\n").replace(/<\s*li[^>]*>/gi, "\u2022 ").replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

// apps/backend/src/services/question.service.ts
var QuestionService = class {
  constructor(aiProvider4) {
    this.aiProvider = aiProvider4;
  }
  aiProvider;
  documentService = new DocumentService();
  async generate(userId, dto) {
    const subject = await prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) {
      throw new AppError(404, "SUBJECT_NOT_FOUND", "Disciplina n\xE3o encontrada");
    }
    if (dto.documentId) {
      return this.generateWithAI(userId, dto, subject.name);
    }
    const imported = await this.findImportedQuestions(dto);
    if (imported.length > 0) {
      return imported;
    }
    return this.generateWithAI(userId, dto, subject.name);
  }
  async findImportedQuestions(dto) {
    const subjectIds = await this.getSubjectTreeIds(dto.subjectId);
    const where = {
      subjectId: { in: subjectIds },
      source: "IMPORTED"
    };
    if (dto.examBoardId) where.examBoardId = dto.examBoardId;
    if (dto.difficulty) where.difficulty = dto.difficulty;
    const total = await prisma.question.count({ where });
    if (total === 0) return [];
    const skip = Math.max(0, Math.floor(Math.random() * (total - dto.quantity)));
    return prisma.question.findMany({
      where,
      skip,
      take: dto.quantity,
      include: { subject: true, examBoard: true }
    });
  }
  async getSubjectTreeIds(subjectId) {
    const children = await prisma.subject.findMany({
      where: { parentId: subjectId },
      select: { id: true }
    });
    if (children.length === 0) return [subjectId];
    return [subjectId, ...children.map((c) => c.id)];
  }
  async generateWithAI(userId, dto, subjectName) {
    let examBoardName;
    if (dto.examBoardId) {
      const board = await prisma.examBoard.findUnique({ where: { id: dto.examBoardId } });
      if (!board) {
        throw new AppError(404, "EXAM_BOARD_NOT_FOUND", "Banca n\xE3o encontrada");
      }
      examBoardName = board.name;
    }
    let context;
    if (dto.documentId) {
      const doc = await prisma.document.findUnique({ where: { id: dto.documentId } });
      if (!doc || doc.userId !== userId) {
        throw new AppError(404, "DOCUMENT_NOT_FOUND", "Documento n\xE3o encontrado");
      }
      context = doc.content;
    } else {
      context = await this.documentService.getContentBySubject(dto.subjectId);
    }
    const generated = await this.aiProvider.generateQuestions({
      subject: subjectName,
      topic: dto.topic,
      examBoard: examBoardName,
      difficulty: dto.difficulty,
      quantity: dto.quantity,
      context: context || void 0
    });
    const saved = await prisma.$transaction(
      generated.map(
        (q) => prisma.question.create({
          data: {
            statement: htmlToPlainText(q.statement),
            alternatives: q.alternatives.map((a) => ({ letter: a.letter, text: htmlToPlainText(a.text) })),
            correctAnswer: q.correctAnswer,
            explanation: htmlToPlainText(q.explanation),
            difficulty: q.difficulty,
            comments: [],
            subjectId: dto.subjectId,
            examBoardId: dto.examBoardId ?? null,
            source: "AI_GENERATED",
            aiModel: "gemini-2.0-flash"
          }
        })
      )
    );
    return saved;
  }
  async getBySubject(subjectId) {
    return prisma.question.findMany({
      where: { subjectId },
      orderBy: { createdAt: "desc" },
      include: { subject: true, examBoard: true }
    });
  }
  async getById(id) {
    const question = await prisma.question.findUnique({
      where: { id },
      include: { subject: true, examBoard: true }
    });
    if (!question) {
      throw new AppError(404, "QUESTION_NOT_FOUND", "Quest\xE3o n\xE3o encontrada");
    }
    return question;
  }
};

// apps/backend/src/controllers/question.controller.ts
var QuestionController = class {
  constructor(service15) {
    this.service = service15;
  }
  service;
  generate = async (req, res, next) => {
    try {
      const questions = await this.service.generate(getUserId(req), req.body);
      const response = { success: true, data: questions };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  getBySubject = async (req, res, next) => {
    try {
      const questions = await this.service.getBySubject(req.params.subjectId);
      const response = { success: true, data: questions };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  getById = async (req, res, next) => {
    try {
      const question = await this.service.getById(req.params.id);
      const response = { success: true, data: question };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
};

// apps/backend/src/validators/question.validators.ts
import { z as z5 } from "zod";
var generateQuestionsSchema = z5.object({
  body: z5.object({
    subjectId: z5.string().min(1),
    topic: z5.string().max(200).optional(),
    examBoardId: z5.string().min(1).optional(),
    difficulty: z5.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    quantity: z5.number().int().min(1).max(10).default(5),
    documentId: z5.string().min(1).optional()
  })
});

// apps/backend/src/providers/ai-prompts.ts
import { z as z6 } from "zod";
var questionsResponseSchema = z6.object({
  questions: z6.array(
    z6.object({
      statement: z6.string(),
      alternatives: z6.array(z6.object({ letter: z6.string(), text: z6.string() })).min(4).max(5),
      correctAnswer: z6.string(),
      explanation: z6.string(),
      difficulty: z6.enum(["EASY", "MEDIUM", "HARD"])
    })
  )
});
var essayCriterionSchema = z6.object({
  score: z6.number().min(0),
  maxScore: z6.number(),
  comments: z6.string()
});
var essayResponseSchema = z6.object({
  score: z6.number().min(0).max(100),
  maxScore: z6.number(),
  feedback: z6.string(),
  criteria: z6.object({
    cac: essayCriterionSchema,
    ot: essayCriterionSchema,
    dlp: essayCriterionSchema
  })
});
var caseStudyResponseSchema = z6.object({
  score: z6.number().min(0),
  maxScore: z6.number().min(1),
  framing: z6.string(),
  aspects: z6.array(
    z6.object({
      aspect: z6.string(),
      situation: z6.enum(["correto", "parcial", "incorreto", "ausente"]),
      points: z6.number().min(0),
      maxPoints: z6.number().min(0),
      justification: z6.string()
    })
  ).min(1),
  form: z6.object({
    strengths: z6.string(),
    issues: z6.string(),
    deduction: z6.number()
  }),
  penalties: z6.array(z6.object({ reason: z6.string(), deduction: z6.number() })),
  calculation: z6.string(),
  feedback: z6.array(z6.string()).min(1)
});
var editalResponseSchema = z6.object({
  name: z6.string(),
  organization: z6.string().nullable(),
  examBoard: z6.string().nullable(),
  role: z6.string().nullable(),
  examDate: z6.string().nullable(),
  syllabus: z6.array(
    z6.object({
      discipline: z6.string(),
      topics: z6.array(z6.string())
    })
  ),
  focusDisciplines: z6.array(z6.string()).nullable().optional()
});
var EDITAL_MAX_CHARS = 7e5;
var EDITAL_HEAD_CHARS = 15e4;
function truncateEdital(content, maxChars = EDITAL_MAX_CHARS) {
  if (content.length <= maxChars) return content;
  const headChars = Math.min(EDITAL_HEAD_CHARS, Math.floor(maxChars * 0.25));
  const head = content.slice(0, headChars);
  const tail = content.slice(-(maxChars - headChars));
  return `${head}

[... trecho intermedi\xE1rio do edital omitido ...]

${tail}`;
}
function buildQuestionsPrompt(params) {
  const difficultyMap = { EASY: "f\xE1cil", MEDIUM: "m\xE9dia", HARD: "dif\xEDcil" };
  const diffText = params.difficulty ? difficultyMap[params.difficulty] : "variada";
  const contextBlock = params.context ? `
MATERIAL DE ESTUDO DO CANDIDATO (baseie-se ESTRITAMENTE neste material \u2014 cada quest\xE3o deve poder ser respondida com o que est\xE1 aqui; n\xE3o cobre nada que n\xE3o esteja no texto):
${params.context}
` : "";
  return `Voc\xEA \xE9 um elaborador experiente de quest\xF5es de concursos p\xFAblicos brasileiros. Gere ${params.quantity} quest\xE3o(\xF5es) de m\xFAltipla escolha sobre "${params.subject}"${params.topic ? `, especificamente sobre "${params.topic}"` : ""}.

${params.examBoard ? `Estilo da banca: ${params.examBoard}. Siga o padr\xE3o de elabora\xE7\xE3o dessa banca.` : ""}
Dificuldade: ${diffText}.
${contextBlock}

REGRAS OBRIGAT\xD3RIAS:
1. Cada quest\xE3o deve ter exatamente 5 alternativas (A, B, C, D, E)
2. Apenas UMA alternativa inequivocamente correta por quest\xE3o \u2014 as demais devem estar claramente erradas para quem domina o conte\xFAdo, sem ambiguidade
3. O enunciado deve ser claro, autocontido e direto: uma \xFAnica pergunta, sem duplas nega\xE7\xF5es, sem "pegadinhas" de reda\xE7\xE3o confusa
4. As alternativas erradas devem ser plaus\xEDveis (erros comuns de candidatos), curtas e com estrutura gramatical semelhante \xE0 correta
5. N\xC3O invente leis, artigos, n\xFAmeros ou datas; se n\xE3o tiver certeza de um dado, n\xE3o o utilize
6. A explica\xE7\xE3o deve justificar por que a alternativa correta est\xE1 certa e por que CADA uma das outras est\xE1 errada
7. Use linguagem formal e t\xE9cnica adequada para concursos
8. Varie a posi\xE7\xE3o da resposta correta entre as quest\xF5es

Responda APENAS com JSON v\xE1lido no seguinte formato, sem markdown ou texto adicional:
{
  "questions": [
    {
      "statement": "Enunciado da quest\xE3o",
      "alternatives": [
        {"letter": "A", "text": "Texto da alternativa A"},
        {"letter": "B", "text": "Texto da alternativa B"},
        {"letter": "C", "text": "Texto da alternativa C"},
        {"letter": "D", "text": "Texto da alternativa D"},
        {"letter": "E", "text": "Texto da alternativa E"}
      ],
      "correctAnswer": "C",
      "explanation": "Explica\xE7\xE3o detalhada",
      "difficulty": "${params.difficulty ?? "MEDIUM"}"
    }
  ]
}`;
}
function buildEssayPrompt(params) {
  const contentBlock = params.content ? `
REDA\xC7\xC3O DO CANDIDATO:
${params.content}` : "\nA reda\xE7\xE3o do candidato est\xE1 na imagem anexada. Extraia o texto manuscrito/digitado e corrija.";
  return `Voc\xEA \xE9 um corretor experiente de reda\xE7\xF5es para concursos p\xFAblicos brasileiros (estilo CESPE/CEBRASPE). Corrija a reda\xE7\xE3o abaixo com rigor t\xE9cnico.

TEMA: "${params.theme}"
${contentBlock}

CRIT\xC9RIOS DE AVALIA\xC7\xC3O:
1. **CAC \u2014 Conte\xFAdo e Atendimento ao Comando** (0 a 40 pontos): Avalia se o candidato compreendeu e atendeu ao tema/comando da proposta. Analisa a pertin\xEAncia dos argumentos, a profundidade da abordagem e o uso de repert\xF3rio sociocultural.
2. **OT \u2014 Organiza\xE7\xE3o Textual** (0 a 30 pontos): Avalia a estrutura dissertativo-argumentativa (introdu\xE7\xE3o, desenvolvimento, conclus\xE3o), a progress\xE3o tem\xE1tica, o encadeamento l\xF3gico dos par\xE1grafos e o uso de conectivos.
3. **DLP \u2014 Dom\xEDnio da L\xEDngua Portuguesa** (0 a 30 pontos): Avalia o dom\xEDnio da norma culta (ortografia, concord\xE2ncia, reg\xEAncia, pontua\xE7\xE3o, crase, coloca\xE7\xE3o pronominal) e a adequa\xE7\xE3o vocabular.

NOTA FINAL (score): Soma dos 3 crit\xE9rios (0 a 100).

FEEDBACK: Texto corrido de 3-5 par\xE1grafos explicando os pontos fortes, fracos e sugest\xF5es de melhoria. Seja construtivo e espec\xEDfico, citando trechos da reda\xE7\xE3o quando relevante.

Responda APENAS com JSON v\xE1lido no seguinte formato, sem markdown ou texto adicional:
{
  "score": 72,
  "maxScore": 100,
  "feedback": "Texto do feedback completo...",
  "criteria": {
    "cac": { "score": 30, "maxScore": 40, "comments": "Coment\xE1rio espec\xEDfico sobre conte\xFAdo e atendimento ao comando..." },
    "ot": { "score": 22, "maxScore": 30, "comments": "Coment\xE1rio espec\xEDfico sobre organiza\xE7\xE3o textual..." },
    "dlp": { "score": 20, "maxScore": 30, "comments": "Coment\xE1rio espec\xEDfico sobre dom\xEDnio da l\xEDngua portuguesa..." }
  }
}`;
}
function buildCaseStudyPrompt(params) {
  const contentBlock = params.content ? params.content : "(A resposta do candidato est\xE1 na imagem anexada. Extraia o texto manuscrito/digitado e corrija.)";
  const answerKeyBlock = params.answerKey?.trim() ? params.answerKey : "N\xE3o foi fornecido espelho oficial. Monte um espelho de refer\xEAncia a partir do comando da quest\xE3o e sinalize no enquadramento que a pontua\xE7\xE3o \xE9 uma refer\xEAncia estimada.";
  return `Voc\xEA \xE9 um avaliador de provas discursivas do tipo "estudo de caso" para concurso p\xFAblico, atuando como uma banca examinadora. Sua tarefa \xE9 corrigir a resposta do candidato com rigor, imparcialidade e consist\xEAncia, seguindo o espelho de corre\xE7\xE3o fornecido.

## Contexto da corre\xE7\xE3o
- Cargo/\xE1rea: ${params.role?.trim() || "gen\xE9rico"}
- Banca/estilo: ${params.examBoard?.trim() || "gen\xE9rico"}
- Enunciado do caso: ${params.caseStatement}
- Limite de linhas: ${params.lineLimit ? `${params.lineLimit} linhas` : "n\xE3o especificado"}
- Espelho de corre\xE7\xE3o (aspectos esperados e pontua\xE7\xE3o): ${answerKeyBlock}
- Resposta do candidato: ${contentBlock}

## Como corrigir
A nota divide-se em duas partes.

### 1. Conte\xFAdo (peso maior)
Para cada aspecto previsto no espelho: verifique se o candidato abordou o ponto e classifique como correto/parcial/incorreto/ausente, atribuindo pontos conforme o espelho (proporcionais em abordagem parcial). Avalie: atendimento ao comando, dom\xEDnio t\xE9cnico (conceitos, legisla\xE7\xE3o, normas), an\xE1lise do caso (problema, vari\xE1veis, rela\xE7\xF5es), solu\xE7\xE3o (vi\xE1vel, fundamentada, aplic\xE1vel) e argumenta\xE7\xE3o (conclus\xF5es que decorrem logicamente).

### 2. Forma
Estrutura textual (coes\xE3o, coer\xEAncia, organiza\xE7\xE3o), norma culta (gram\xE1tica, ortografia, pontua\xE7\xE3o, concord\xE2ncia) e clareza/objetividade. Aplique descontos por erros de forma.

### 3. Penalidades
Desconto por linha excedente ao limite; fuga total ao tema ou resposta em branco zera o aspecto com justificativa; n\xE3o pontue "encher lingui\xE7a".

## Regras de conduta
- Baseie-se exclusivamente na resposta enviada e no espelho; n\xE3o presuma conhecimento n\xE3o escrito.
- Seja consistente: o mesmo erro recebe o mesmo desconto sempre.
- Cite trechos da resposta ao justificar cada pontua\xE7\xE3o.
- Tom t\xE9cnico, impessoal e construtivo.

Responda APENAS com JSON v\xE1lido no formato abaixo, sem markdown ou texto adicional. "maxScore" \xE9 a soma dos pontos poss\xEDveis do espelho; "score" \xE9 a nota final (conte\xFAdo + forma \u2212 penalidades); "form.deduction" e "penalties[].deduction" s\xE3o valores positivos que foram subtra\xEDdos; "calculation" mostra o c\xE1lculo expl\xEDcito da nota final:
{
  "score": 7.5,
  "maxScore": 10,
  "framing": "1-2 frases sobre o que a quest\xE3o pediu.",
  "aspects": [
    { "aspect": "Identifica\xE7\xE3o do problema central", "situation": "correto", "points": 2, "maxPoints": 2, "justification": "Justificativa citando trecho da resposta." }
  ],
  "form": { "strengths": "Pontos fortes da forma.", "issues": "Erros de forma identificados.", "deduction": 0.5 },
  "penalties": [ { "reason": "Excedeu 3 linhas do limite", "deduction": 0.3 } ],
  "calculation": "Conte\xFAdo 8,0 + Forma \u22120,5 \u2212 Penalidades 0,3 = 7,2",
  "feedback": ["Recomenda\xE7\xE3o 1", "Recomenda\xE7\xE3o 2", "Recomenda\xE7\xE3o 3"]
}`;
}
function buildEditalPrompt(content, focus) {
  const focusBlock = focus ? `

FOCO DO CANDIDATO: "${focus}"
Al\xE9m de extrair o conte\xFAdo COMPLETO, identifique em **focusDisciplines** APENAS as disciplinas do syllabus que s\xE3o exigidas para esse foco/cargo (inclua as disciplinas comuns a todos os cargos, como L\xEDngua Portuguesa e conhecimentos gerais, mais as espec\xEDficas do foco). Use exatamente os mesmos nomes de disciplina que aparecem no syllabus. Se o foco n\xE3o corresponder a nenhuma disciplina espec\xEDfica, retorne focusDisciplines como null.` : "";
  const focusField = focus ? '\n  "focusDisciplines": ["L\xEDngua Portuguesa", "Sociologia"],' : "";
  return `Voc\xEA \xE9 um especialista em concursos p\xFAblicos brasileiros. Analise o texto do edital abaixo e extraia as informa\xE7\xF5es estruturadas.

TEXTO DO EDITAL:
${content}

EXTRAIA:
1. **name** \u2014 Nome curto do concurso (\xF3rg\xE3o + cargo principal), ex: "SEEDF \u2014 Professor de Educa\xE7\xE3o B\xE1sica"
2. **organization** \u2014 Nome completo do \xF3rg\xE3o realizador
3. **examBoard** \u2014 Banca organizadora (ex: CESPE/CEBRASPE, FGV, FCC). null se n\xE3o encontrar.
4. **role** \u2014 Cargo/fun\xE7\xE3o principal do edital. null se n\xE3o encontrar.
5. **examDate** \u2014 Data da prova objetiva no formato YYYY-MM-DD. null se n\xE3o encontrada.
6. **syllabus** \u2014 Conte\xFAdo program\xE1tico COMPLETO: para cada disciplina, liste TODOS os t\xF3picos exatamente como aparecem no edital. N\xE3o resuma, n\xE3o omita t\xF3picos. Separe t\xF3picos compostos em itens individuais quando fizer sentido.${focusBlock}

Responda APENAS com JSON v\xE1lido no seguinte formato, sem markdown ou texto adicional:
{
  "name": "\xD3rg\xE3o \u2014 Cargo",
  "organization": "Nome completo do \xF3rg\xE3o",
  "examBoard": "Banca",
  "role": "Cargo",
  "examDate": "2026-10-15",${focusField}
  "syllabus": [
    {
      "discipline": "L\xEDngua Portuguesa",
      "topics": ["T\xF3pico 1", "T\xF3pico 2"]
    }
  ]
}`;
}
var FLASHCARD_MAX_CONTENT = 12e3;
var flashcardsResponseSchema = z6.object({
  flashcards: z6.array(z6.object({ front: z6.string().min(1), back: z6.string().min(1) })).min(1)
});
function buildFlashcardsPrompt(params) {
  const content = params.content.slice(0, FLASHCARD_MAX_CONTENT);
  const subjectBlock = params.subject ? ` da disciplina "${params.subject}"` : "";
  return `Voc\xEA \xE9 um especialista em t\xE9cnicas de memoriza\xE7\xE3o para concursos p\xFAblicos. A partir do CONTE\xDADO DE ESTUDO abaixo${subjectBlock}, crie ${params.count} flashcards de pergunta e resposta para revis\xE3o espa\xE7ada.

CONTE\xDADO DE ESTUDO:
${content}

REGRAS OBRIGAT\xD3RIAS:
1. Baseie-se ESTRITAMENTE no conte\xFAdo fornecido \u2014 n\xE3o invente fatos que n\xE3o estejam no texto.
2. Cada flashcard deve testar UM conceito espec\xEDfico e importante (at\xF4mico).
3. A "front" \xE9 uma pergunta direta e objetiva; a "back" \xE9 a resposta completa mas concisa.
4. Evite perguntas de sim/n\xE3o. Prefira "O que \xE9...", "Qual...", "Quando...", "Por que...".
5. Priorize os pontos mais cobrados em prova (defini\xE7\xF5es, prazos, exce\xE7\xF5es, classifica\xE7\xF5es).
6. N\xE3o repita o mesmo conceito em cards diferentes.

Responda APENAS com JSON v\xE1lido no seguinte formato, sem markdown ou texto adicional:
{
  "flashcards": [
    { "front": "Pergunta objetiva?", "back": "Resposta completa e concisa." }
  ]
}`;
}
function buildTopicContentPrompt(params) {
  const bancaBlock = params.examBoard ? ` A prova \xE9 da banca ${params.examBoard}; foque no que costuma ser cobrado por ela.` : "";
  return `Voc\xEA \xE9 um professor experiente que prepara candidatos para concursos p\xFAblicos brasileiros. Escreva um material de estudo objetivo e did\xE1tico sobre o t\xF3pico abaixo.

DISCIPLINA: ${params.discipline}
T\xD3PICO: ${params.topic}${bancaBlock}

O material deve conter, em portugu\xEAs, formatado em Markdown:
1. Um resumo dos conceitos essenciais do t\xF3pico (o que o candidato precisa dominar)
2. Os pontos mais cobrados em prova e poss\xEDveis pegadinhas
3. Uma dica pr\xE1tica de memoriza\xE7\xE3o ou resolu\xE7\xE3o

Seja direto e did\xE1tico. Use listas e negrito para destacar o essencial. N\xE3o invente legisla\xE7\xE3o nem dados; se citar leis, cite apenas as reconhecidas. Escreva de 200 a 400 palavras. Responda APENAS com o material em Markdown, sem pre\xE2mbulo.`;
}
function stripJsonMarkdown(raw2) {
  return raw2.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}

// apps/backend/src/providers/gemini.provider.ts
var GeminiProvider = class {
  apiKey;
  model = "gemini-2.0-flash";
  baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  async generateQuestions(params) {
    const raw2 = await this.callApi(buildQuestionsPrompt(params));
    const parsed = this.parseJson(raw2, "gera\xE7\xE3o de quest\xF5es");
    const result = questionsResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, "AI_INVALID_FORMAT", `Formato de resposta inv\xE1lido: ${result.error.message}`);
    }
    if (result.data.questions.length < params.quantity) {
      console.warn(`Gemini gerou ${result.data.questions.length} quest\xF5es, esperava ${params.quantity}`);
    }
    return result.data.questions;
  }
  async gradeEssay(params) {
    const prompt = buildEssayPrompt(params);
    const raw2 = params.filePath && params.fileMimeType?.startsWith("image/") ? await this.callApiWithImage(prompt, params.filePath, params.fileMimeType) : await this.callApi(prompt);
    const parsed = this.parseJson(raw2, "corre\xE7\xE3o de reda\xE7\xE3o");
    const result = essayResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, "AI_INVALID_FORMAT", `Formato de corre\xE7\xE3o inv\xE1lido: ${result.error.message}`);
    }
    return result.data;
  }
  async gradeCaseStudy(params) {
    const prompt = buildCaseStudyPrompt(params);
    const raw2 = params.filePath && params.fileMimeType?.startsWith("image/") ? await this.callApiWithImage(prompt, params.filePath, params.fileMimeType) : await this.callApi(prompt);
    const parsed = this.parseJson(raw2, "corre\xE7\xE3o de estudo de caso");
    const result = caseStudyResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, "AI_INVALID_FORMAT", `Formato de corre\xE7\xE3o inv\xE1lido: ${result.error.message}`);
    }
    return result.data;
  }
  async parseEdital(params) {
    const raw2 = await this.callApi(buildEditalPrompt(truncateEdital(params.content), params.focus));
    const parsed = this.parseJson(raw2, "an\xE1lise de edital");
    const result = editalResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, "AI_INVALID_FORMAT", `Formato de an\xE1lise de edital inv\xE1lido: ${result.error.message}`);
    }
    return result.data;
  }
  async generateTopicContent(params) {
    return this.callApi(buildTopicContentPrompt(params), 2, false);
  }
  async generateFlashcards(params) {
    const raw2 = await this.callApi(buildFlashcardsPrompt(params));
    const parsed = this.parseJson(raw2, "gera\xE7\xE3o de flashcards");
    const result = flashcardsResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, "AI_INVALID_FORMAT", `Formato de flashcards inv\xE1lido: ${result.error.message}`);
    }
    return result.data.flashcards;
  }
  parseJson(raw2, context) {
    try {
      return JSON.parse(stripJsonMarkdown(raw2));
    } catch {
      throw new AppError(502, "AI_INVALID_JSON", `Gemini retornou JSON inv\xE1lido na ${context}`);
    }
  }
  async callApiWithImage(prompt, filePath, mimeType) {
    const fs6 = await import("node:fs");
    const base64 = fs6.readFileSync(filePath).toString("base64");
    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64 } }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          responseMimeType: "application/json"
        }
      })
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new AppError(502, "AI_API_ERROR", `Gemini API error: ${response.status} \u2014 ${errorBody}`);
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new AppError(502, "AI_EMPTY_RESPONSE", "Gemini retornou resposta vazia");
    }
    return text;
  }
  async callApi(prompt, retries = 2, json = true) {
    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.9,
              ...json ? { responseMimeType: "application/json" } : {}
            }
          })
        });
        if (!response.ok) {
          const errorBody = await response.text();
          if (response.status === 429 && attempt < retries) {
            await this.delay(2e3 * (attempt + 1));
            continue;
          }
          throw new AppError(502, "AI_API_ERROR", `Gemini API error: ${response.status} \u2014 ${errorBody}`);
        }
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new AppError(502, "AI_EMPTY_RESPONSE", "Gemini retornou resposta vazia");
        }
        return text;
      } catch (error) {
        if (error instanceof AppError) throw error;
        if (attempt < retries) {
          await this.delay(1e3 * (attempt + 1));
          continue;
        }
        throw new AppError(502, "AI_CONNECTION_ERROR", "Falha na conex\xE3o com a API do Gemini");
      }
    }
    throw new AppError(502, "AI_MAX_RETRIES", "N\xFAmero m\xE1ximo de tentativas excedido");
  }
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};

// apps/backend/src/providers/ollama.provider.ts
var OLLAMA_EDITAL_MAX_CHARS = 6e4;
var REQUEST_TIMEOUT_MS = 10 * 60 * 1e3;
var OllamaProvider = class {
  constructor(baseUrl, model) {
    this.baseUrl = baseUrl;
    this.model = model;
  }
  baseUrl;
  model;
  async generateQuestions(params) {
    const raw2 = await this.callApi(buildQuestionsPrompt(params));
    const parsed = this.parseJson(raw2, "gera\xE7\xE3o de quest\xF5es");
    const result = questionsResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, "AI_INVALID_FORMAT", `Formato de resposta inv\xE1lido do modelo local: ${result.error.message}`);
    }
    return result.data.questions;
  }
  async gradeEssay(params) {
    if (!params.content && params.fileMimeType?.startsWith("image/")) {
      throw new AppError(
        400,
        "IMAGE_NOT_SUPPORTED",
        "O modelo de IA local n\xE3o l\xEA imagens. Envie a reda\xE7\xE3o em PDF com texto ou digite o conte\xFAdo."
      );
    }
    const raw2 = await this.callApi(buildEssayPrompt(params));
    const parsed = this.parseJson(raw2, "corre\xE7\xE3o de reda\xE7\xE3o");
    const result = essayResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, "AI_INVALID_FORMAT", `Formato de corre\xE7\xE3o inv\xE1lido do modelo local: ${result.error.message}`);
    }
    return result.data;
  }
  async gradeCaseStudy(params) {
    if (!params.content && params.fileMimeType?.startsWith("image/")) {
      throw new AppError(
        400,
        "IMAGE_NOT_SUPPORTED",
        "O modelo de IA local n\xE3o l\xEA imagens. Envie a resposta em PDF com texto ou digite o conte\xFAdo."
      );
    }
    const raw2 = await this.callApi(buildCaseStudyPrompt(params));
    const parsed = this.parseJson(raw2, "corre\xE7\xE3o de estudo de caso");
    const result = caseStudyResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, "AI_INVALID_FORMAT", `Formato de corre\xE7\xE3o inv\xE1lido do modelo local: ${result.error.message}`);
    }
    return result.data;
  }
  async parseEdital(params) {
    const content = truncateEdital(params.content, OLLAMA_EDITAL_MAX_CHARS);
    const raw2 = await this.callApi(buildEditalPrompt(content, params.focus));
    const parsed = this.parseJson(raw2, "an\xE1lise de edital");
    const result = editalResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, "AI_INVALID_FORMAT", `Formato de an\xE1lise de edital inv\xE1lido do modelo local: ${result.error.message}`);
    }
    return result.data;
  }
  async generateTopicContent(params) {
    const text = await this.callApi(buildTopicContentPrompt(params), false);
    return text.trim();
  }
  async generateFlashcards(params) {
    const raw2 = await this.callApi(buildFlashcardsPrompt(params));
    const parsed = this.parseJson(raw2, "gera\xE7\xE3o de flashcards");
    const result = flashcardsResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, "AI_INVALID_FORMAT", `Formato de flashcards inv\xE1lido do modelo local: ${result.error.message}`);
    }
    return result.data.flashcards;
  }
  async callApi(prompt, json = true) {
    let response;
    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        body: JSON.stringify({
          model: this.model,
          stream: false,
          ...json ? { format: "json" } : {},
          options: { temperature: 0.7, num_ctx: 32768 },
          messages: [{ role: "user", content: prompt }]
        })
      });
    } catch {
      throw new AppError(
        502,
        "AI_CONNECTION_ERROR",
        `N\xE3o foi poss\xEDvel conectar ao Ollama em ${this.baseUrl}. Verifique se o Ollama est\xE1 em execu\xE7\xE3o (ollama serve).`
      );
    }
    if (!response.ok) {
      const body = await response.text();
      throw new AppError(502, "AI_API_ERROR", `Erro do Ollama: ${response.status} \u2014 ${body}`);
    }
    const data = await response.json();
    const text = data.message?.content;
    if (!text) {
      throw new AppError(502, "AI_EMPTY_RESPONSE", "O modelo local retornou resposta vazia");
    }
    return text;
  }
  parseJson(raw2, context) {
    try {
      return JSON.parse(stripJsonMarkdown(raw2));
    } catch {
      throw new AppError(502, "AI_INVALID_JSON", `O modelo local retornou JSON inv\xE1lido na ${context}`);
    }
  }
};

// apps/backend/src/providers/mock.provider.ts
var MockProvider = class {
  async generateQuestions(params) {
    const difficulties = ["EASY", "MEDIUM", "HARD"];
    const questions = [];
    for (let i = 0; i < params.quantity; i++) {
      const diff = params.difficulty ?? difficulties[i % 3];
      questions.push({
        statement: `[MOCK] Quest\xE3o ${i + 1} sobre ${params.subject}${params.topic ? ` \u2014 ${params.topic}` : ""}. ${params.examBoard ? `Estilo ${params.examBoard}.` : ""} Qual alternativa est\xE1 correta?`,
        alternatives: [
          { letter: "A", text: `Alternativa A da quest\xE3o ${i + 1}` },
          { letter: "B", text: `Alternativa B da quest\xE3o ${i + 1}` },
          { letter: "C", text: `Alternativa C da quest\xE3o ${i + 1} (correta)` },
          { letter: "D", text: `Alternativa D da quest\xE3o ${i + 1}` },
          { letter: "E", text: `Alternativa E da quest\xE3o ${i + 1}` }
        ],
        correctAnswer: "C",
        explanation: `Explica\xE7\xE3o detalhada da quest\xE3o ${i + 1}. A alternativa C est\xE1 correta porque aborda corretamente o conceito de ${params.subject}.`,
        difficulty: diff
      });
    }
    return questions;
  }
  async gradeEssay(_params) {
    const cacScore = Math.floor(Math.random() * 10) + 25;
    const otScore = Math.floor(Math.random() * 10) + 20;
    const dlpScore = Math.floor(Math.random() * 10) + 20;
    const total = cacScore + otScore + dlpScore;
    return {
      score: total,
      maxScore: 100,
      feedback: `[MOCK] Sua reda\xE7\xE3o demonstra bom dom\xEDnio do tema proposto, com argumenta\xE7\xE3o consistente e estrutura textual adequada. O texto apresenta introdu\xE7\xE3o contextualizada, desenvolvimento com argumentos pertinentes e conclus\xE3o que retoma a tese principal.

Pontos fortes: boa articula\xE7\xE3o entre os par\xE1grafos, uso adequado de conectivos e repert\xF3rio sociocultural diversificado.

Pontos a melhorar: a proposta de interven\xE7\xE3o poderia ser mais detalhada, com agentes, a\xE7\xF5es e meios mais espec\xEDficos. Alguns desvios de concord\xE2ncia e reg\xEAncia foram identificados.

Nota final: ${total}/100.`,
      criteria: {
        cac: {
          score: cacScore,
          maxScore: 40,
          comments: "[MOCK] Conte\xFAdo e Atendimento ao Comando: O candidato demonstrou compreens\xE3o do tema e atendeu ao comando da proposta. A abordagem \xE9 pertinente, com argumentos que dialogam com o recorte tem\xE1tico. Poderia aprofundar a discuss\xE3o com mais exemplos concretos e dados estat\xEDsticos."
        },
        ot: {
          score: otScore,
          maxScore: 30,
          comments: "[MOCK] Organiza\xE7\xE3o Textual: O texto apresenta estrutura dissertativo-argumentativa adequada, com introdu\xE7\xE3o, desenvolvimento e conclus\xE3o bem delimitados. A progress\xE3o tem\xE1tica \xE9 satisfat\xF3ria, embora alguns par\xE1grafos pudessem ter melhor encadeamento l\xF3gico."
        },
        dlp: {
          score: dlpScore,
          maxScore: 30,
          comments: "[MOCK] Dom\xEDnio da L\xEDngua Portuguesa: Bom dom\xEDnio da norma culta, com poucos desvios gramaticais. Vocabul\xE1rio adequado ao g\xEAnero textual. Aten\xE7\xE3o a alguns problemas de concord\xE2ncia verbal e uso de crase."
        }
      }
    };
  }
  async gradeCaseStudy(_params) {
    return {
      score: 7.2,
      maxScore: 10,
      framing: "[MOCK] A quest\xE3o pediu a an\xE1lise de um caso e a proposta de solu\xE7\xE3o fundamentada.",
      aspects: [
        { aspect: "Identifica\xE7\xE3o do problema central", situation: "correto", points: 2, maxPoints: 2, justification: "[MOCK] O candidato identificou corretamente o problema, conforme trecho citado." },
        { aspect: "Fundamenta\xE7\xE3o legal/normativa", situation: "parcial", points: 1.5, maxPoints: 3, justification: "[MOCK] Citou a norma, mas n\xE3o aprofundou a aplica\xE7\xE3o ao caso." },
        { aspect: "Proposta de solu\xE7\xE3o vi\xE1vel", situation: "correto", points: 3, maxPoints: 3, justification: "[MOCK] Solu\xE7\xE3o aplic\xE1vel e bem fundamentada." }
      ],
      form: { strengths: "[MOCK] Texto coeso e organizado.", issues: "[MOCK] Alguns desvios de pontua\xE7\xE3o.", deduction: 0.5 },
      penalties: [{ reason: "[MOCK] Excedeu 2 linhas do limite", deduction: 0.3 }],
      calculation: "Conte\xFAdo 6,5 + Forma \u22120,5 \u2212 Penalidades 0,3 = 7,2 (mock)",
      feedback: [
        "[MOCK] Aprofunde a fundamenta\xE7\xE3o legal aplicando a norma ao caso concreto.",
        "[MOCK] Revise a pontua\xE7\xE3o antes de entregar.",
        "[MOCK] Controle o n\xFAmero de linhas para n\xE3o sofrer penalidade."
      ]
    };
  }
  async parseEdital(params) {
    const examDate = /* @__PURE__ */ new Date();
    examDate.setDate(examDate.getDate() + 90);
    return {
      name: "[MOCK] SEEDF \u2014 Professor de Educa\xE7\xE3o B\xE1sica",
      organization: "Secretaria de Estado de Educa\xE7\xE3o do Distrito Federal",
      examBoard: "CESPE/CEBRASPE",
      role: "Professor de Educa\xE7\xE3o B\xE1sica \u2014 Sociologia",
      examDate: examDate.toISOString().slice(0, 10),
      focusDisciplines: params.focus ? ["L\xEDngua Portuguesa", "Conhecimentos Pedag\xF3gicos", "Sociologia"] : null,
      syllabus: [
        {
          discipline: "L\xEDngua Portuguesa",
          topics: [
            "Compreens\xE3o e interpreta\xE7\xE3o de textos",
            "Tipologia textual e g\xEAneros textuais",
            "Ortografia oficial e acentua\xE7\xE3o gr\xE1fica",
            "Concord\xE2ncia verbal e nominal",
            "Reg\xEAncia verbal e nominal"
          ]
        },
        {
          discipline: "Conhecimentos Pedag\xF3gicos",
          topics: [
            "Lei de Diretrizes e Bases da Educa\xE7\xE3o Nacional (LDB)",
            "Curr\xEDculo em Movimento do Distrito Federal",
            "Avalia\xE7\xE3o educacional e institucional",
            "Gest\xE3o democr\xE1tica na escola p\xFAblica"
          ]
        },
        {
          discipline: "Sociologia",
          topics: [
            "Cl\xE1ssicos da Sociologia: Durkheim, Weber e Marx",
            "Cultura, identidade e diversidade",
            "Estratifica\xE7\xE3o e desigualdades sociais",
            "Movimentos sociais no Brasil",
            "Sociologia da educa\xE7\xE3o"
          ]
        }
      ]
    };
  }
  async generateTopicContent(params) {
    return `## ${params.topic}

**[MOCK]** Material de estudo de exemplo para *${params.discipline}*.

### Conceitos essenciais
- Ponto-chave 1 do t\xF3pico "${params.topic}".
- Ponto-chave 2, com foco no que a banca costuma cobrar.
- Ponto-chave 3, relacionando o t\xF3pico a casos pr\xE1ticos.

### Mais cobrado em prova
- Defini\xE7\xF5es e classifica\xE7\xF5es costumam cair em quest\xF5es objetivas.
- **Pegadinha comum:** trocar termos parecidos entre si.

### Dica de memoriza\xE7\xE3o
Associe cada conceito a um exemplo do dia a dia para fixar melhor.`;
  }
  async generateFlashcards(params) {
    const subject = params.subject ?? "o tema estudado";
    return Array.from({ length: params.count }, (_, i) => ({
      front: `[MOCK] Pergunta ${i + 1} sobre ${subject}?`,
      back: `[MOCK] Resposta ${i + 1} baseada no conte\xFAdo enviado, resumindo o conceito principal.`
    }));
  }
};

// apps/backend/src/providers/ai.factory.ts
function createAIProvider() {
  switch (env.AI_PROVIDER) {
    case "gemini": {
      if (!env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is required when AI_PROVIDER=gemini");
      }
      return new GeminiProvider(env.GEMINI_API_KEY);
    }
    case "ollama":
      return new OllamaProvider(env.OLLAMA_URL, env.OLLAMA_MODEL);
    case "mock":
      return new MockProvider();
    default:
      return new MockProvider();
  }
}

// apps/backend/src/routes/question.routes.ts
var router4 = Router4();
var aiProvider = createAIProvider();
var service3 = new QuestionService(aiProvider);
var controller3 = new QuestionController(service3);
router4.post("/generate", authMiddleware, validateRequest(generateQuestionsSchema), controller3.generate);
router4.get("/subject/:subjectId", authMiddleware, controller3.getBySubject);
router4.get("/:id", authMiddleware, controller3.getById);

// apps/backend/src/routes/study.routes.ts
import { Router as Router5 } from "express";

// apps/backend/src/services/gamification.service.ts
var ACHIEVEMENT_DEFS = {
  FIRST_QUESTION: {
    name: "Primeira Quest\xE3o",
    description: "Respondeu sua primeira quest\xE3o",
    check: (s) => s.totalAnswered >= 1
  },
  TEN_QUESTIONS: {
    name: "Dedicado",
    description: "Respondeu 10 quest\xF5es",
    check: (s) => s.totalAnswered >= 10
  },
  FIFTY_QUESTIONS: {
    name: "Estudioso",
    description: "Respondeu 50 quest\xF5es",
    check: (s) => s.totalAnswered >= 50
  },
  HUNDRED_QUESTIONS: {
    name: "Veterano",
    description: "Respondeu 100 quest\xF5es",
    check: (s) => s.totalAnswered >= 100
  },
  PERFECT_SESSION: {
    name: "Perfei\xE7\xE3o",
    description: "Acertou todas as quest\xF5es em uma sess\xE3o",
    check: (s) => s.hadPerfectSession
  },
  STREAK_3: {
    name: "Const\xE2ncia",
    description: "3 dias seguidos estudando",
    check: (s) => s.currentStreak >= 3
  },
  STREAK_7: {
    name: "Semana Perfeita",
    description: "7 dias seguidos estudando",
    check: (s) => s.currentStreak >= 7
  },
  STREAK_30: {
    name: "Maratonista",
    description: "30 dias seguidos estudando",
    check: (s) => s.currentStreak >= 30
  },
  FIRST_FLASHCARD: {
    name: "Memorizador",
    description: "Criou seu primeiro flashcard",
    check: (s) => s.totalFlashcards >= 1
  }
};
var GamificationService = class {
  async updateStreak(userId) {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    let streak = await prisma.streak.findUnique({ where: { userId } });
    if (!streak) {
      streak = await prisma.streak.create({
        data: { userId, current: 1, longest: 1, lastDate: today }
      });
      return streak;
    }
    const lastDate = new Date(streak.lastDate);
    lastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1e3 * 60 * 60 * 24));
    if (diffDays === 0) return streak;
    if (diffDays === 1) {
      const newCurrent = streak.current + 1;
      return prisma.streak.update({
        where: { userId },
        data: {
          current: newCurrent,
          longest: Math.max(streak.longest, newCurrent),
          lastDate: today
        }
      });
    }
    return prisma.streak.update({
      where: { userId },
      data: { current: 1, lastDate: today }
    });
  }
  async checkAchievements(userId) {
    const stats = await this.getGameStats(userId);
    const existing = await prisma.achievement.findMany({ where: { userId } });
    const existingTypes = new Set(existing.map((a) => a.type));
    const newAchievements = [];
    for (const [type, def] of Object.entries(ACHIEVEMENT_DEFS)) {
      if (!existingTypes.has(type) && def.check(stats)) {
        await prisma.achievement.create({ data: { userId, type } });
        newAchievements.push(type);
      }
    }
    return newAchievements;
  }
  async getProfile(userId) {
    const [streak, achievements, stats] = await Promise.all([
      prisma.streak.findUnique({ where: { userId } }),
      prisma.achievement.findMany({ where: { userId }, orderBy: { unlockedAt: "desc" } }),
      this.getGameStats(userId)
    ]);
    return {
      streak: streak ?? { current: 0, longest: 0 },
      achievements: achievements.map((a) => ({
        type: a.type,
        ...ACHIEVEMENT_DEFS[a.type],
        unlockedAt: a.unlockedAt
      })),
      availableAchievements: Object.entries(ACHIEVEMENT_DEFS).map(([type, def]) => ({
        type,
        name: def.name,
        description: def.description,
        unlocked: achievements.some((a) => a.type === type)
      })),
      stats
    };
  }
  async getGameStats(userId) {
    const [totalAnswered, perfectSessions, totalFlashcards, streak] = await Promise.all([
      prisma.questionAttempt.count({ where: { userId } }),
      prisma.studySession.findMany({
        where: { userId, correctCount: { gt: 0 } },
        select: { questionsCount: true, correctCount: true }
      }),
      prisma.flashcard.count({ where: { userId } }),
      prisma.streak.findUnique({ where: { userId } })
    ]);
    const hadPerfectSession = perfectSessions.some(
      (s) => s.questionsCount > 0 && s.questionsCount === s.correctCount
    );
    return {
      totalAnswered,
      currentStreak: streak?.current ?? 0,
      hadPerfectSession,
      totalFlashcards
    };
  }
};

// apps/backend/src/services/group.service.ts
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
var POINTS_MAP = {
  SESSION_COMPLETED: 10,
  QUESTION_CORRECT: 2,
  QUESTION_ANSWERED: 1,
  PERFECT_SESSION: 20,
  FLASHCARD_REVIEW: 3,
  STREAK_DAY: 5
};
var GroupService = class {
  async create(userId, dto) {
    let code = generateCode();
    while (await prisma.studyGroup.findUnique({ where: { code } })) {
      code = generateCode();
    }
    const group = await prisma.studyGroup.create({
      data: {
        name: dto.name,
        description: dto.description,
        code,
        createdById: userId,
        members: {
          create: { userId, role: "ADMIN" }
        }
      },
      include: { members: { include: { user: { select: { id: true, name: true, avatar: true } } } } }
    });
    return group;
  }
  async join(userId, code) {
    const group = await prisma.studyGroup.findUnique({ where: { code } });
    if (!group) {
      throw new AppError(404, "GROUP_NOT_FOUND", "Grupo n\xE3o encontrado com este c\xF3digo");
    }
    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } }
    });
    if (existing) {
      throw new AppError(409, "ALREADY_MEMBER", "Voc\xEA j\xE1 faz parte deste grupo");
    }
    await prisma.groupMember.create({
      data: { groupId: group.id, userId }
    });
    return this.getById(userId, group.id);
  }
  async getById(userId, groupId) {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });
    if (!member) {
      throw new AppError(403, "NOT_MEMBER", "Voc\xEA n\xE3o \xE9 membro deste grupo");
    }
    return prisma.studyGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { joinedAt: "asc" }
        }
      }
    });
  }
  async listMyGroups(userId) {
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, avatar: true } } }
            },
            _count: { select: { members: true } }
          }
        }
      },
      orderBy: { joinedAt: "desc" }
    });
    return memberships.map((m) => ({ ...m.group, myRole: m.role }));
  }
  async leave(userId, groupId) {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });
    if (!member) {
      throw new AppError(404, "NOT_MEMBER", "Voc\xEA n\xE3o \xE9 membro deste grupo");
    }
    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } }
    });
    const remaining = await prisma.groupMember.count({ where: { groupId } });
    if (remaining === 0) {
      await prisma.studyGroup.delete({ where: { id: groupId } });
    }
  }
  async getRanking(userId, groupId) {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });
    if (!member) {
      throw new AppError(403, "NOT_MEMBER", "Voc\xEA n\xE3o \xE9 membro deste grupo");
    }
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true, avatar: true } } }
    });
    const now = /* @__PURE__ */ new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const activities = await prisma.groupActivity.groupBy({
      by: ["userId"],
      where: { groupId, createdAt: { gte: weekStart } },
      _sum: { points: true }
    });
    const pointsMap = {};
    for (const a of activities) {
      pointsMap[a.userId] = a._sum.points ?? 0;
    }
    const allTimeActivities = await prisma.groupActivity.groupBy({
      by: ["userId"],
      where: { groupId },
      _sum: { points: true }
    });
    const allTimeMap = {};
    for (const a of allTimeActivities) {
      allTimeMap[a.userId] = a._sum.points ?? 0;
    }
    return members.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      avatar: m.user.avatar,
      weekPoints: pointsMap[m.user.id] ?? 0,
      totalPoints: allTimeMap[m.user.id] ?? 0
    })).sort((a, b) => b.weekPoints - a.weekPoints);
  }
  async getFeed(userId, groupId) {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });
    if (!member) {
      throw new AppError(403, "NOT_MEMBER", "Voc\xEA n\xE3o \xE9 membro deste grupo");
    }
    return prisma.groupActivity.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      take: 50
    });
  }
  async recordActivity(userId, type, description, customPoints) {
    const points = customPoints ?? POINTS_MAP[type] ?? 1;
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true }
    });
    if (memberships.length === 0) return;
    await prisma.groupActivity.createMany({
      data: memberships.map((m) => ({
        groupId: m.groupId,
        userId,
        type,
        points,
        description
      }))
    });
  }
};

// apps/backend/src/services/study.service.ts
var StudyService = class {
  gamification = new GamificationService();
  groups = new GroupService();
  async createSession(userId, dto) {
    const session = await prisma.studySession.create({
      data: {
        userId,
        subjectId: dto.subjectId ?? null,
        mode: dto.mode,
        difficulty: dto.difficulty ?? null,
        examBoardId: dto.examBoardId ?? null,
        questionsCount: dto.questionIds.length,
        correctCount: 0,
        totalTime: 0
      }
    });
    return { session, questionIds: dto.questionIds };
  }
  async submitAnswer(userId, sessionId, dto) {
    const session = await prisma.studySession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new AppError(404, "SESSION_NOT_FOUND", "Sess\xE3o n\xE3o encontrada");
    }
    const question = await prisma.question.findUnique({ where: { id: dto.questionId } });
    if (!question) {
      throw new AppError(404, "QUESTION_NOT_FOUND", "Quest\xE3o n\xE3o encontrada");
    }
    const isCorrect = dto.answer === question.correctAnswer;
    const attempt = await prisma.questionAttempt.create({
      data: {
        userId,
        questionId: dto.questionId,
        answer: dto.answer,
        isCorrect,
        timeSpent: dto.timeSpent
      }
    });
    return { attempt, isCorrect, correctAnswer: question.correctAnswer, explanation: question.explanation };
  }
  async finishSession(userId, sessionId) {
    const session = await prisma.studySession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new AppError(404, "SESSION_NOT_FOUND", "Sess\xE3o n\xE3o encontrada");
    }
    const attempts = await prisma.questionAttempt.findMany({
      where: { userId, createdAt: { gte: session.createdAt } },
      orderBy: { createdAt: "desc" },
      take: session.questionsCount
    });
    const correctCount = attempts.filter((a) => a.isCorrect).length;
    const totalTime = attempts.reduce((sum, a) => sum + a.timeSpent, 0);
    const updated = await prisma.studySession.update({
      where: { id: sessionId },
      data: { correctCount, totalTime }
    });
    await this.gamification.updateStreak(userId);
    const newAchievements = await this.gamification.checkAchievements(userId);
    const isPerfect = correctCount === session.questionsCount && session.questionsCount > 0;
    await this.groups.recordActivity(
      userId,
      isPerfect ? "PERFECT_SESSION" : "SESSION_COMPLETED",
      `Completou sess\xE3o: ${correctCount}/${session.questionsCount} acertos`
    );
    return {
      session: updated,
      attempts,
      stats: {
        total: session.questionsCount,
        correct: correctCount,
        wrong: session.questionsCount - correctCount,
        accuracy: session.questionsCount > 0 ? Math.round(correctCount / session.questionsCount * 100) : 0,
        totalTime
      },
      newAchievements
    };
  }
  async toggleFavorite(userId, questionId) {
    const existing = await prisma.favorite.findUnique({
      where: { userId_questionId: { userId, questionId } }
    });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }
    await prisma.favorite.create({ data: { userId, questionId } });
    return { favorited: true };
  }
  async getUserStats(userId) {
    const [totalAttempts, correctAttempts, totalSessions, totalTime] = await Promise.all([
      prisma.questionAttempt.count({ where: { userId } }),
      prisma.questionAttempt.count({ where: { userId, isCorrect: true } }),
      prisma.studySession.count({ where: { userId } }),
      prisma.studySession.aggregate({ where: { userId }, _sum: { totalTime: true } })
    ]);
    return {
      questionsAnswered: totalAttempts,
      correctAnswers: correctAttempts,
      accuracy: totalAttempts > 0 ? Math.round(correctAttempts / totalAttempts * 100) : 0,
      totalSessions,
      totalTimeSeconds: totalTime._sum.totalTime ?? 0
    };
  }
  async getSessionHistory(userId) {
    return prisma.studySession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20
    });
  }
};

// apps/backend/src/controllers/study.controller.ts
var StudyController = class {
  constructor(service15) {
    this.service = service15;
  }
  service;
  createSession = async (req, res, next) => {
    try {
      const result = await this.service.createSession(getUserId(req), req.body);
      const response = { success: true, data: result };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  submitAnswer = async (req, res, next) => {
    try {
      const result = await this.service.submitAnswer(getUserId(req), req.params.sessionId, req.body);
      const response = { success: true, data: result };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  finishSession = async (req, res, next) => {
    try {
      const result = await this.service.finishSession(getUserId(req), req.params.sessionId);
      const response = { success: true, data: result };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  toggleFavorite = async (req, res, next) => {
    try {
      const result = await this.service.toggleFavorite(getUserId(req), req.body.questionId);
      const response = { success: true, data: result };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  getStats = async (req, res, next) => {
    try {
      const stats = await this.service.getUserStats(getUserId(req));
      const response = { success: true, data: stats };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  getHistory = async (req, res, next) => {
    try {
      const sessions = await this.service.getSessionHistory(getUserId(req));
      const response = { success: true, data: sessions };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
};

// apps/backend/src/validators/study.validators.ts
import { z as z7 } from "zod";
var createStudySessionSchema = z7.object({
  body: z7.object({
    subjectId: z7.string().min(1).optional(),
    mode: z7.enum(["STUDY", "EXAM"]),
    difficulty: z7.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    examBoardId: z7.string().min(1).optional(),
    questionIds: z7.array(z7.string().min(1)).min(1).max(50)
  })
});
var submitAnswerSchema = z7.object({
  body: z7.object({
    questionId: z7.string().min(1),
    answer: z7.string().min(1).max(1),
    timeSpent: z7.number().int().min(0)
  }),
  params: z7.object({
    sessionId: z7.string().min(1)
  })
});
var finishSessionSchema = z7.object({
  params: z7.object({
    sessionId: z7.string().min(1)
  })
});
var toggleFavoriteSchema = z7.object({
  body: z7.object({
    questionId: z7.string().min(1)
  })
});

// apps/backend/src/routes/study.routes.ts
var router5 = Router5();
var service4 = new StudyService();
var controller4 = new StudyController(service4);
router5.post("/sessions", authMiddleware, validateRequest(createStudySessionSchema), controller4.createSession);
router5.post("/sessions/:sessionId/answer", authMiddleware, validateRequest(submitAnswerSchema), controller4.submitAnswer);
router5.post("/sessions/:sessionId/finish", authMiddleware, validateRequest(finishSessionSchema), controller4.finishSession);
router5.post("/favorites", authMiddleware, validateRequest(toggleFavoriteSchema), controller4.toggleFavorite);
router5.get("/stats", authMiddleware, controller4.getStats);
router5.get("/history", authMiddleware, controller4.getHistory);

// apps/backend/src/routes/document.routes.ts
import { Router as Router6 } from "express";

// apps/backend/src/controllers/document.controller.ts
var DocumentController = class {
  constructor(service15) {
    this.service = service15;
  }
  service;
  upload = async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError(400, "NO_FILE", "Nenhum arquivo enviado");
      }
      const subjectId = req.body.subjectId;
      const doc = await this.service.upload(getUserId(req), req.file, subjectId);
      const response = { success: true, data: doc };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  list = async (req, res, next) => {
    try {
      const subjectId = req.query.subjectId;
      const docs = await this.service.list(getUserId(req), subjectId);
      const response = { success: true, data: docs };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  getById = async (req, res, next) => {
    try {
      const doc = await this.service.getById(getUserId(req), req.params.id);
      const response = { success: true, data: doc };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  delete = async (req, res, next) => {
    try {
      await this.service.delete(getUserId(req), req.params.id);
      const response = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
};

// apps/backend/src/routes/document.routes.ts
var router6 = Router6();
var service5 = new DocumentService();
var controller5 = new DocumentController(service5);
router6.post("/", authMiddleware, upload.single("file"), controller5.upload);
router6.get("/", authMiddleware, controller5.list);
router6.get("/:id", authMiddleware, controller5.getById);
router6.delete("/:id", authMiddleware, controller5.delete);

// apps/backend/src/routes/study-plan.routes.ts
import { Router as Router7 } from "express";

// apps/backend/src/services/study-plan.service.ts
var StudyPlanService = class {
  async create(userId, dto) {
    await prisma.studyPlan.updateMany({
      where: { userId, active: true },
      data: { active: false }
    });
    return prisma.studyPlan.create({
      data: {
        userId,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        items: {
          create: dto.items.map((item) => ({
            subjectId: item.subjectId,
            dayOfWeek: item.dayOfWeek,
            duration: item.duration
          }))
        }
      },
      include: { items: { include: { subject: true } } }
    });
  }
  async getActive(userId) {
    return prisma.studyPlan.findFirst({
      where: { userId, active: true },
      include: { items: { include: { subject: true } } }
    });
  }
  async list(userId) {
    return prisma.studyPlan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { subject: true } } }
    });
  }
  async toggleItemComplete(userId, itemId) {
    const item = await prisma.studyPlanItem.findUnique({
      where: { id: itemId },
      include: { plan: true }
    });
    if (!item || item.plan.userId !== userId) {
      throw new AppError(404, "ITEM_NOT_FOUND", "Item n\xE3o encontrado");
    }
    return prisma.studyPlanItem.update({
      where: { id: itemId },
      data: { completed: !item.completed }
    });
  }
  async delete(userId, planId) {
    const plan = await prisma.studyPlan.findUnique({ where: { id: planId } });
    if (!plan || plan.userId !== userId) {
      throw new AppError(404, "PLAN_NOT_FOUND", "Plano n\xE3o encontrado");
    }
    await prisma.studyPlan.delete({ where: { id: planId } });
  }
  async generateSuggestion(userId) {
    const subjectAttempts = await prisma.questionAttempt.findMany({
      where: { userId },
      include: { question: { select: { subjectId: true } } }
    });
    const subjectStats = {};
    for (const attempt of subjectAttempts) {
      const sid = attempt.question.subjectId;
      if (!subjectStats[sid]) subjectStats[sid] = { total: 0, correct: 0 };
      subjectStats[sid].total++;
      if (attempt.isCorrect) subjectStats[sid].correct++;
    }
    const subjects = await prisma.subject.findMany({
      where: { id: { in: Object.keys(subjectStats) } }
    });
    const ranked = subjects.map((s) => ({
      subjectId: s.id,
      name: s.name,
      accuracy: subjectStats[s.id] ? Math.round(subjectStats[s.id].correct / subjectStats[s.id].total * 100) : 0,
      total: subjectStats[s.id]?.total ?? 0
    })).sort((a, b) => a.accuracy - b.accuracy);
    return ranked;
  }
};

// apps/backend/src/controllers/study-plan.controller.ts
var StudyPlanController = class {
  constructor(service15) {
    this.service = service15;
  }
  service;
  create = async (req, res, next) => {
    try {
      const plan = await this.service.create(getUserId(req), req.body);
      const response = { success: true, data: plan };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  getActive = async (req, res, next) => {
    try {
      const plan = await this.service.getActive(getUserId(req));
      const response = { success: true, data: plan };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  list = async (req, res, next) => {
    try {
      const plans = await this.service.list(getUserId(req));
      const response = { success: true, data: plans };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  toggleItem = async (req, res, next) => {
    try {
      const item = await this.service.toggleItemComplete(getUserId(req), req.params.itemId);
      const response = { success: true, data: item };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  delete = async (req, res, next) => {
    try {
      await this.service.delete(getUserId(req), req.params.id);
      const response = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  suggest = async (req, res, next) => {
    try {
      const suggestion = await this.service.generateSuggestion(getUserId(req));
      const response = { success: true, data: suggestion };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
};

// apps/backend/src/routes/study-plan.routes.ts
var router7 = Router7();
var service6 = new StudyPlanService();
var controller6 = new StudyPlanController(service6);
router7.post("/", authMiddleware, controller6.create);
router7.get("/active", authMiddleware, controller6.getActive);
router7.get("/suggest", authMiddleware, controller6.suggest);
router7.get("/", authMiddleware, controller6.list);
router7.patch("/items/:itemId/toggle", authMiddleware, controller6.toggleItem);
router7.delete("/:id", authMiddleware, controller6.delete);

// apps/backend/src/routes/flashcard.routes.ts
import { Router as Router8 } from "express";

// apps/backend/src/utils/flashcard-parser.ts
var MAX_CARDS = 1e3;
var MAX_FIELD_LENGTH = 2e3;
var SEPARATOR_NAMES = {
  tab: "	",
  comma: ",",
  semicolon: ";",
  pipe: "|"
};
function stripHtml(text) {
  return text.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
}
function splitLine(line, separator) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}
function detectSeparator(lines) {
  const sample = lines.slice(0, 10);
  const counts = { "	": 0, ";": 0, ",": 0 };
  for (const line of sample) {
    if (line.includes("	")) counts["	"]++;
    if (line.includes(";")) counts[";"]++;
    if (line.includes(",")) counts[","]++;
  }
  if (counts["	"] > 0) return "	";
  if (counts[";"] >= counts[","]) return ";";
  return ",";
}
function isHeaderRow(fields) {
  const first = fields[0]?.toLowerCase().trim();
  const second = fields[1]?.toLowerCase().trim();
  const headerWords = ["front", "back", "frente", "verso", "pergunta", "resposta", "question", "answer"];
  return headerWords.includes(first) && headerWords.includes(second);
}
function parseFlashcardText(raw2) {
  const lines = raw2.split(/\r?\n/);
  let separator = null;
  let tagsColumn = null;
  const dataLines = [];
  let skipped = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) {
      const sepMatch = trimmed.match(/^#separator:\s*(\S+)/i);
      if (sepMatch) separator = SEPARATOR_NAMES[sepMatch[1].toLowerCase()] ?? sepMatch[1];
      const tagsMatch = trimmed.match(/^#tags column:\s*(\d+)/i);
      if (tagsMatch) tagsColumn = Number(tagsMatch[1]);
      continue;
    }
    dataLines.push(line);
  }
  const sep = separator ?? detectSeparator(dataLines);
  const cards = [];
  dataLines.forEach((line, index) => {
    if (cards.length >= MAX_CARDS) {
      skipped++;
      return;
    }
    const fields = splitLine(line, sep).map((f) => stripHtml(f));
    if (index === 0 && isHeaderRow(fields)) return;
    const front = fields[0]?.slice(0, MAX_FIELD_LENGTH);
    const back = fields.slice(1).filter((f, i) => f.length > 0 && (tagsColumn === null || i + 2 !== tagsColumn)).join(" \u2014 ").slice(0, MAX_FIELD_LENGTH);
    if (front && back) {
      cards.push({ front, back });
    } else {
      skipped++;
    }
  });
  return { cards, skipped };
}

// apps/backend/src/services/flashcard.service.ts
var MAX_GENERATED_CARDS = 30;
var FlashcardService = class {
  constructor(aiProvider4) {
    this.aiProvider = aiProvider4;
  }
  aiProvider;
  async create(userId, dto) {
    return prisma.flashcard.create({
      data: { userId, subjectId: dto.subjectId, front: dto.front, back: dto.back }
    });
  }
  async generateFromContent(userId, dto) {
    const subject = await prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) {
      throw new AppError(404, "SUBJECT_NOT_FOUND", "Disciplina n\xE3o encontrada");
    }
    let content = dto.text?.trim() ?? "";
    if (!content && dto.documentId) {
      const doc = await prisma.document.findUnique({ where: { id: dto.documentId } });
      if (!doc || doc.userId !== userId) {
        throw new AppError(404, "DOCUMENT_NOT_FOUND", "Documento n\xE3o encontrado");
      }
      content = doc.content;
    }
    if (content.length < 50) {
      throw new AppError(400, "CONTENT_TOO_SHORT", "Envie um texto ou documento com conte\xFAdo suficiente para gerar flashcards.");
    }
    const count = Math.min(Math.max(dto.count, 1), MAX_GENERATED_CARDS);
    const generated = await this.aiProvider.generateFlashcards({
      content,
      subject: subject.name,
      count
    });
    return prisma.$transaction(
      generated.map(
        (card) => prisma.flashcard.create({
          data: { userId, subjectId: dto.subjectId, front: card.front, back: card.back }
        })
      )
    );
  }
  async importCards(userId, dto) {
    const subject = await prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) {
      throw new AppError(404, "SUBJECT_NOT_FOUND", "Disciplina n\xE3o encontrada");
    }
    const { cards, skipped } = parseFlashcardText(dto.text ?? "");
    if (cards.length === 0) {
      throw new AppError(
        400,
        "NO_CARDS_FOUND",
        'Nenhum flashcard reconhecido. Use um arquivo com "frente" e "verso" separados por tab, ponto e v\xEDrgula ou v\xEDrgula (uma linha por cart\xE3o).'
      );
    }
    await prisma.flashcard.createMany({
      data: cards.map((card) => ({
        userId,
        subjectId: dto.subjectId,
        front: card.front,
        back: card.back
      }))
    });
    return { imported: cards.length, skipped };
  }
  async getDueCards(userId, subjectId) {
    return prisma.flashcard.findMany({
      where: {
        userId,
        nextReview: { lte: /* @__PURE__ */ new Date() },
        ...subjectId ? { subjectId } : {}
      },
      orderBy: { nextReview: "asc" },
      take: 20,
      include: { subject: true }
    });
  }
  async review(userId, cardId, dto) {
    const card = await prisma.flashcard.findUnique({ where: { id: cardId } });
    if (!card || card.userId !== userId) {
      throw new AppError(404, "CARD_NOT_FOUND", "Flashcard n\xE3o encontrado");
    }
    const { interval, easeFactor, repetition } = this.sm2(
      dto.quality,
      card.repetition,
      card.easeFactor,
      card.interval
    );
    const nextReview = /* @__PURE__ */ new Date();
    nextReview.setDate(nextReview.getDate() + interval);
    return prisma.flashcard.update({
      where: { id: cardId },
      data: { interval, easeFactor, repetition, nextReview }
    });
  }
  async list(userId, subjectId) {
    return prisma.flashcard.findMany({
      where: { userId, ...subjectId ? { subjectId } : {} },
      orderBy: { createdAt: "desc" },
      include: { subject: true }
    });
  }
  async delete(userId, cardId) {
    const card = await prisma.flashcard.findUnique({ where: { id: cardId } });
    if (!card || card.userId !== userId) {
      throw new AppError(404, "CARD_NOT_FOUND", "Flashcard n\xE3o encontrado");
    }
    await prisma.flashcard.delete({ where: { id: cardId } });
  }
  async getStats(userId) {
    const [total, due] = await Promise.all([
      prisma.flashcard.count({ where: { userId } }),
      prisma.flashcard.count({ where: { userId, nextReview: { lte: /* @__PURE__ */ new Date() } } })
    ]);
    return { total, due };
  }
  sm2(quality, repetition, easeFactor, interval) {
    const q = Math.max(0, Math.min(5, quality));
    if (q < 3) {
      return { interval: 1, easeFactor, repetition: 0 };
    }
    let newInterval;
    if (repetition === 0) {
      newInterval = 1;
    } else if (repetition === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    const newEF = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    );
    return { interval: newInterval, easeFactor: newEF, repetition: repetition + 1 };
  }
};

// apps/backend/src/controllers/flashcard.controller.ts
var FlashcardController = class {
  constructor(service15) {
    this.service = service15;
  }
  service;
  create = async (req, res, next) => {
    try {
      const card = await this.service.create(getUserId(req), req.body);
      const response = { success: true, data: card };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  generate = async (req, res, next) => {
    try {
      const cards = await this.service.generateFromContent(getUserId(req), req.body);
      const response = { success: true, data: cards };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  import = async (req, res, next) => {
    try {
      const result = await this.service.importCards(getUserId(req), req.body);
      const response = { success: true, data: result };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  getDue = async (req, res, next) => {
    try {
      const subjectId = req.query.subjectId;
      const cards = await this.service.getDueCards(getUserId(req), subjectId);
      const response = { success: true, data: cards };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  review = async (req, res, next) => {
    try {
      const card = await this.service.review(getUserId(req), req.params.id, req.body);
      const response = { success: true, data: card };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  list = async (req, res, next) => {
    try {
      const subjectId = req.query.subjectId;
      const cards = await this.service.list(getUserId(req), subjectId);
      const response = { success: true, data: cards };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  delete = async (req, res, next) => {
    try {
      await this.service.delete(getUserId(req), req.params.id);
      const response = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  getStats = async (req, res, next) => {
    try {
      const stats = await this.service.getStats(getUserId(req));
      const response = { success: true, data: stats };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
};

// apps/backend/src/routes/flashcard.routes.ts
var router8 = Router8();
var service7 = new FlashcardService(createAIProvider());
var controller7 = new FlashcardController(service7);
router8.post("/", authMiddleware, controller7.create);
router8.post("/generate", authMiddleware, controller7.generate);
router8.post("/import", authMiddleware, controller7.import);
router8.get("/due", authMiddleware, controller7.getDue);
router8.get("/stats", authMiddleware, controller7.getStats);
router8.get("/", authMiddleware, controller7.list);
router8.patch("/:id/review", authMiddleware, controller7.review);
router8.delete("/:id", authMiddleware, controller7.delete);

// apps/backend/src/routes/gamification.routes.ts
import { Router as Router9 } from "express";

// apps/backend/src/controllers/gamification.controller.ts
var GamificationController = class {
  constructor(service15) {
    this.service = service15;
  }
  service;
  getProfile = async (req, res, next) => {
    try {
      const profile = await this.service.getProfile(getUserId(req));
      const response = { success: true, data: profile };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  checkAchievements = async (req, res, next) => {
    try {
      const newAchievements = await this.service.checkAchievements(getUserId(req));
      const response = { success: true, data: newAchievements };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
};

// apps/backend/src/routes/gamification.routes.ts
var router9 = Router9();
var service8 = new GamificationService();
var controller8 = new GamificationController(service8);
router9.get("/profile", authMiddleware, controller8.getProfile);
router9.post("/check", authMiddleware, controller8.checkAchievements);

// apps/backend/src/routes/group.routes.ts
import { Router as Router10 } from "express";

// apps/backend/src/controllers/group.controller.ts
var GroupController = class {
  constructor(service15) {
    this.service = service15;
  }
  service;
  create = async (req, res, next) => {
    try {
      const group = await this.service.create(getUserId(req), req.body);
      const response = { success: true, data: group };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  join = async (req, res, next) => {
    try {
      const group = await this.service.join(getUserId(req), req.body.code);
      const response = { success: true, data: group };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  listMyGroups = async (req, res, next) => {
    try {
      const groups = await this.service.listMyGroups(getUserId(req));
      const response = { success: true, data: groups };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  getById = async (req, res, next) => {
    try {
      const group = await this.service.getById(getUserId(req), req.params.id);
      const response = { success: true, data: group };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  getRanking = async (req, res, next) => {
    try {
      const ranking = await this.service.getRanking(getUserId(req), req.params.id);
      const response = { success: true, data: ranking };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  getFeed = async (req, res, next) => {
    try {
      const feed = await this.service.getFeed(getUserId(req), req.params.id);
      const response = { success: true, data: feed };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  leave = async (req, res, next) => {
    try {
      await this.service.leave(getUserId(req), req.params.id);
      const response = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
};

// apps/backend/src/routes/group.routes.ts
var router10 = Router10();
var service9 = new GroupService();
var controller9 = new GroupController(service9);
router10.post("/", authMiddleware, controller9.create);
router10.post("/join", authMiddleware, controller9.join);
router10.get("/", authMiddleware, controller9.listMyGroups);
router10.get("/:id", authMiddleware, controller9.getById);
router10.get("/:id/ranking", authMiddleware, controller9.getRanking);
router10.get("/:id/feed", authMiddleware, controller9.getFeed);
router10.delete("/:id/leave", authMiddleware, controller9.leave);

// apps/backend/src/routes/essay.routes.ts
import { Router as Router11 } from "express";

// apps/backend/src/utils/pdf.ts
import fs2 from "node:fs/promises";
import { PDFParse as PDFParse2 } from "pdf-parse";
async function extractPdfText(filePath) {
  const data = await fs2.readFile(filePath);
  const parser = new PDFParse2({ data: new Uint8Array(data) });
  await parser.load();
  const result = await parser.getText();
  return result.text.trim();
}

// apps/backend/src/services/essay.service.ts
var ESSAY_SUBMISSION_POINTS = 1;
var EssayService = class {
  constructor(aiProvider4) {
    this.aiProvider = aiProvider4;
  }
  aiProvider;
  groupService = new GroupService();
  async submit(userId, params) {
    const { dto, file } = params;
    const isCaseStudy = dto.type === "ESTUDO_CASO";
    if (!dto.content && !file) {
      throw new AppError(400, "MISSING_CONTENT", "Envie o texto da resposta ou um arquivo (PDF/imagem).");
    }
    if (isCaseStudy && !dto.caseStatement?.trim()) {
      throw new AppError(400, "MISSING_CASE_STATEMENT", "Informe o enunciado do caso para a corre\xE7\xE3o do estudo de caso.");
    }
    let content = dto.content ?? "";
    if (!content && file && file.mimetype === "application/pdf") {
      content = await extractPdfText(file.path);
    }
    const essay = await prisma.essay.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title,
        theme: dto.theme,
        content,
        role: dto.role ?? null,
        examBoard: dto.examBoard ?? null,
        caseStatement: dto.caseStatement ?? null,
        answerKey: dto.answerKey ?? null,
        lineLimit: dto.lineLimit ?? null,
        fileUrl: file ? `/uploads/essays/${file.path.split(/[/\\]/).pop()}` : null,
        fileName: file?.originalname ?? null,
        status: "GRADING"
      }
    });
    try {
      const { score, maxScore, feedback, criteria } = isCaseStudy ? await this.gradeCaseStudy(dto, content, file) : await this.gradeDissertativa(dto, content, file);
      const graded = await prisma.essay.update({
        where: { id: essay.id },
        data: {
          score,
          maxScore,
          feedback,
          criteria,
          status: "GRADED"
        }
      });
      const totalPoints = ESSAY_SUBMISSION_POINTS + Math.round(score / maxScore * 10);
      await this.groupService.recordActivity(
        userId,
        "ESSAY_SUBMITTED",
        `Enviou ${isCaseStudy ? "estudo de caso" : "reda\xE7\xE3o"} "${dto.title}" \u2014 Nota: ${score}/${maxScore}`,
        totalPoints
      );
      return { ...graded, competitionPoints: totalPoints };
    } catch (error) {
      await prisma.essay.update({
        where: { id: essay.id },
        data: { status: "ERROR" }
      });
      throw error;
    }
  }
  async gradeDissertativa(dto, content, file) {
    const result = await this.aiProvider.gradeEssay({
      theme: dto.theme,
      content: content || void 0,
      filePath: file?.path,
      fileMimeType: file?.mimetype
    });
    return { score: result.score, maxScore: result.maxScore, feedback: result.feedback, criteria: result.criteria };
  }
  async gradeCaseStudy(dto, content, file) {
    const result = await this.aiProvider.gradeCaseStudy({
      role: dto.role,
      examBoard: dto.examBoard,
      caseStatement: dto.caseStatement ?? dto.theme,
      answerKey: dto.answerKey,
      lineLimit: dto.lineLimit,
      content: content || void 0,
      filePath: file?.path,
      fileMimeType: file?.mimetype
    });
    return { score: result.score, maxScore: result.maxScore, feedback: result.framing, criteria: result };
  }
  async listByUser(userId) {
    return prisma.essay.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        title: true,
        theme: true,
        status: true,
        score: true,
        maxScore: true,
        fileName: true,
        createdAt: true
      }
    });
  }
  async getById(userId, essayId) {
    const essay = await prisma.essay.findUnique({
      where: { id: essayId }
    });
    if (!essay) {
      throw new AppError(404, "ESSAY_NOT_FOUND", "Reda\xE7\xE3o n\xE3o encontrada");
    }
    if (essay.userId !== userId) {
      throw new AppError(403, "FORBIDDEN", "Sem permiss\xE3o para acessar esta reda\xE7\xE3o");
    }
    return essay;
  }
  async delete(userId, essayId) {
    const essay = await prisma.essay.findUnique({
      where: { id: essayId },
      select: { userId: true }
    });
    if (!essay) {
      throw new AppError(404, "ESSAY_NOT_FOUND", "Reda\xE7\xE3o n\xE3o encontrada");
    }
    if (essay.userId !== userId) {
      throw new AppError(403, "FORBIDDEN", "Sem permiss\xE3o para excluir esta reda\xE7\xE3o");
    }
    await prisma.essay.delete({ where: { id: essayId } });
  }
};

// apps/backend/src/controllers/essay.controller.ts
var EssayController = class {
  constructor(service15) {
    this.service = service15;
  }
  service;
  submit = async (req, res, next) => {
    try {
      const file = req.file;
      const essay = await this.service.submit(getUserId(req), {
        dto: req.body,
        file: file ? { path: file.path, originalname: file.originalname, mimetype: file.mimetype } : void 0
      });
      const response = { success: true, data: essay };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  list = async (req, res, next) => {
    try {
      const essays = await this.service.listByUser(getUserId(req));
      const response = { success: true, data: essays };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  getById = async (req, res, next) => {
    try {
      const essay = await this.service.getById(getUserId(req), req.params.id);
      const response = { success: true, data: essay };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  delete = async (req, res, next) => {
    try {
      await this.service.delete(getUserId(req), req.params.id);
      const response = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
};

// apps/backend/src/middlewares/essay-upload.ts
import multer2 from "multer";
import path2 from "node:path";
import crypto3 from "node:crypto";
import fs3 from "node:fs";
var UPLOAD_DIR2 = path2.resolve("uploads/essays");
var MAX_FILE_SIZE2 = 10 * 1024 * 1024;
if (!fs3.existsSync(UPLOAD_DIR2)) {
  fs3.mkdirSync(UPLOAD_DIR2, { recursive: true });
}
var ALLOWED_MIMES2 = {
  "application/pdf": true,
  "image/jpeg": true,
  "image/png": true,
  "image/webp": true
};
var storage2 = multer2.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR2),
  filename: (_req, file, cb) => {
    const ext = path2.extname(file.originalname);
    cb(null, `${crypto3.randomUUID()}${ext}`);
  }
});
var essayUpload = multer2({
  storage: storage2,
  limits: { fileSize: MAX_FILE_SIZE2 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES2[file.mimetype]) {
      cb(new AppError(400, "INVALID_FILE_TYPE", "Tipo de arquivo n\xE3o suportado. Use PDF, JPG, PNG ou WebP."));
      return;
    }
    cb(null, true);
  }
});

// apps/backend/src/validators/essay.validators.ts
import { z as z8 } from "zod";
var submitEssaySchema = z8.object({
  body: z8.object({
    type: z8.enum(["DISSERTATIVA", "ESTUDO_CASO"]).default("DISSERTATIVA"),
    title: z8.string().min(3).max(200),
    theme: z8.string().min(3).max(500),
    content: z8.string().max(15e3).optional(),
    // Campos específicos de estudo de caso (chegam como string no multipart)
    role: z8.string().max(200).optional(),
    examBoard: z8.string().max(200).optional(),
    caseStatement: z8.string().max(8e3).optional(),
    answerKey: z8.string().max(8e3).optional(),
    lineLimit: z8.coerce.number().int().min(1).max(200).optional()
  })
});

// apps/backend/src/routes/essay.routes.ts
var router11 = Router11();
var aiProvider2 = createAIProvider();
var service10 = new EssayService(aiProvider2);
var controller10 = new EssayController(service10);
router11.post("/", authMiddleware, essayUpload.single("file"), validateRequest(submitEssaySchema), controller10.submit);
router11.get("/", authMiddleware, controller10.list);
router11.get("/:id", authMiddleware, controller10.getById);
router11.delete("/:id", authMiddleware, controller10.delete);

// apps/backend/src/routes/contest.routes.ts
import { Router as Router12 } from "express";

// apps/backend/src/services/contest.service.ts
import fs4 from "node:fs/promises";

// apps/backend/src/utils/spaced-repetition.ts
var REVIEW_INTERVALS = [1, 3, 7, 15, 40, 60];
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function buildReviewSchedule(from, intervals = REVIEW_INTERVALS) {
  const base = startOfDay(from);
  return intervals.map((intervalDays, index) => ({
    index,
    intervalDays,
    scheduledFor: addDays(base, intervalDays)
  }));
}

// apps/backend/src/utils/priority.ts
var WEIGHT_IMPORTANCE = 0.45;
var WEIGHT_OVERDUE = 0.35;
var WEIGHT_COVERAGE = 0.2;
var OVERDUE_SATURATION = 3;
function computeDisciplinePriority(input) {
  const importanceNorm = clamp01(input.importance / 10);
  const overdueNorm = clamp01(input.dueReviews / OVERDUE_SATURATION);
  const coverageGap = input.totalTopics > 0 ? clamp01((input.totalTopics - input.studiedTopics) / input.totalTopics) : 0;
  const score = WEIGHT_IMPORTANCE * importanceNorm + WEIGHT_OVERDUE * overdueNorm + WEIGHT_COVERAGE * coverageGap;
  return Math.round(score * 1e3) / 100;
}
function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

// apps/backend/src/services/contest.service.ts
var ContestService = class {
  constructor(aiProvider4) {
    this.aiProvider = aiProvider4;
  }
  aiProvider;
  async create(userId, dto) {
    return prisma.contest.create({
      data: {
        userId,
        name: dto.name,
        organization: dto.organization ?? null,
        examBoard: dto.examBoard ?? null,
        role: dto.role ?? null,
        examDate: dto.examDate ? new Date(dto.examDate) : null
      },
      include: { syllabus: true }
    });
  }
  async createFromEdital(userId, file, focus) {
    const content = file.mimetype === "application/pdf" ? await extractPdfText(file.path) : decodeTextBuffer(await fs4.readFile(file.path)).trim();
    await fs4.unlink(file.path).catch(() => {
    });
    if (content.length < 200) {
      throw new AppError(400, "EDITAL_TOO_SHORT", "N\xE3o foi poss\xEDvel extrair texto suficiente do edital. Verifique se o PDF cont\xE9m texto (n\xE3o apenas imagens).");
    }
    const trimmedFocus = focus?.trim() || void 0;
    const parsed = await this.aiProvider.parseEdital({ content, focus: trimmedFocus });
    const focusSet = parsed.focusDisciplines && parsed.focusDisciplines.length > 0 ? new Set(parsed.focusDisciplines.map((d) => d.toLowerCase().trim())) : null;
    const document = await prisma.document.create({
      data: {
        userId,
        name: file.originalname,
        type: "PDF",
        content
      }
    });
    return prisma.contest.create({
      data: {
        userId,
        name: parsed.name,
        organization: parsed.organization,
        examBoard: parsed.examBoard,
        role: parsed.role,
        focus: trimmedFocus ?? null,
        examDate: parsed.examDate ? new Date(parsed.examDate) : null,
        editalDocumentId: document.id,
        syllabus: {
          create: parsed.syllabus.flatMap(
            (entry, disciplineIndex) => entry.topics.map((topic, topicIndex) => ({
              discipline: entry.discipline,
              topic,
              order: disciplineIndex * 1e3 + topicIndex,
              focus: focusSet ? focusSet.has(entry.discipline.toLowerCase().trim()) : true
            }))
          )
        }
      },
      include: { syllabus: { orderBy: { order: "asc" } } }
    });
  }
  async getTopicContent(userId, itemId) {
    const item = await prisma.contestSyllabusItem.findUnique({
      where: { id: itemId },
      include: { contest: { select: { userId: true, examBoard: true, focus: true } } }
    });
    if (!item || item.contest.userId !== userId) {
      throw new AppError(404, "SYLLABUS_ITEM_NOT_FOUND", "Item do conte\xFAdo program\xE1tico n\xE3o encontrado");
    }
    if (item.content) {
      return { id: item.id, content: item.content };
    }
    const content = await this.aiProvider.generateTopicContent({
      discipline: item.discipline,
      topic: item.topic,
      examBoard: item.contest.examBoard,
      focus: item.contest.focus
    });
    await prisma.contestSyllabusItem.update({
      where: { id: itemId },
      data: { content }
    });
    return { id: item.id, content };
  }
  async listByUser(userId) {
    const contests = await prisma.contest.findMany({
      where: { userId, status: { not: "ARCHIVED" } },
      orderBy: [{ examDate: "asc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { syllabus: true } },
        syllabus: { where: { studied: true }, select: { id: true } }
      }
    });
    return contests.map(({ syllabus, _count, ...contest }) => ({
      ...contest,
      totalTopics: _count.syllabus,
      studiedTopics: syllabus.length
    }));
  }
  async getById(userId, contestId) {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        syllabus: {
          orderBy: { order: "asc" },
          include: { reviews: { orderBy: { index: "asc" } } }
        }
      }
    });
    if (!contest || contest.userId !== userId) {
      throw new AppError(404, "CONTEST_NOT_FOUND", "Concurso n\xE3o encontrado");
    }
    return { ...contest, disciplines: this.buildDisciplineStats(contest.syllabus) };
  }
  buildDisciplineStats(syllabus) {
    const dueCutoff = addDays(startOfDay(/* @__PURE__ */ new Date()), 1);
    const groups = /* @__PURE__ */ new Map();
    for (const item of syllabus) {
      const list = groups.get(item.discipline) ?? [];
      list.push(item);
      groups.set(item.discipline, list);
    }
    return Array.from(groups.entries()).map(([discipline, items]) => {
      const studied = items.filter((i) => i.studied).length;
      const dueReviews = items.reduce(
        (acc, i) => acc + i.reviews.filter((r) => !r.completedAt && r.scheduledFor < dueCutoff).length,
        0
      );
      const importance = items[0]?.importance ?? 5;
      return {
        discipline,
        inFocus: items.some((i) => i.focus),
        total: items.length,
        studied,
        dueReviews,
        importance,
        priority: computeDisciplinePriority({ importance, totalTopics: items.length, studiedTopics: studied, dueReviews })
      };
    }).sort((a, b) => b.priority - a.priority);
  }
  async setImportance(userId, contestId, discipline, importance) {
    await this.getById(userId, contestId);
    await prisma.contestSyllabusItem.updateMany({
      where: { contestId, discipline },
      data: { importance }
    });
    return this.getById(userId, contestId);
  }
  async update(userId, contestId, dto) {
    await this.getById(userId, contestId);
    return prisma.contest.update({
      where: { id: contestId },
      data: {
        ...dto.name !== void 0 ? { name: dto.name } : {},
        ...dto.organization !== void 0 ? { organization: dto.organization } : {},
        ...dto.examBoard !== void 0 ? { examBoard: dto.examBoard } : {},
        ...dto.role !== void 0 ? { role: dto.role } : {},
        ...dto.examDate !== void 0 ? { examDate: dto.examDate ? new Date(dto.examDate) : null } : {},
        ...dto.status !== void 0 ? { status: dto.status } : {}
      },
      include: { syllabus: { orderBy: { order: "asc" } } }
    });
  }
  async delete(userId, contestId) {
    await this.getById(userId, contestId);
    await prisma.contest.delete({ where: { id: contestId } });
  }
  async updateSyllabusItem(userId, itemId, studied) {
    const item = await prisma.contestSyllabusItem.findUnique({
      where: { id: itemId },
      include: { contest: { select: { userId: true } }, reviews: { select: { id: true } } }
    });
    if (!item || item.contest.userId !== userId) {
      throw new AppError(404, "SYLLABUS_ITEM_NOT_FOUND", "Item do conte\xFAdo program\xE1tico n\xE3o encontrado");
    }
    if (studied && item.reviews.length === 0) {
      const schedule = buildReviewSchedule(/* @__PURE__ */ new Date());
      await prisma.topicReview.createMany({
        data: schedule.map((r) => ({ ...r, userId, syllabusItemId: itemId }))
      });
    }
    if (!studied) {
      await prisma.topicReview.deleteMany({ where: { syllabusItemId: itemId } });
    }
    return prisma.contestSyllabusItem.update({
      where: { id: itemId },
      data: { studied, firstStudiedAt: studied ? item.firstStudiedAt ?? /* @__PURE__ */ new Date() : null },
      include: { reviews: { orderBy: { index: "asc" } } }
    });
  }
};

// apps/backend/src/services/contest-review.service.ts
var ContestReviewService = class {
  async complete(userId, reviewId, completed) {
    const review = await prisma.topicReview.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true }
    });
    if (!review || review.userId !== userId) {
      throw new AppError(404, "REVIEW_NOT_FOUND", "Revis\xE3o n\xE3o encontrada");
    }
    return prisma.topicReview.update({
      where: { id: reviewId },
      data: { completedAt: completed ? /* @__PURE__ */ new Date() : null }
    });
  }
  async listDue(userId) {
    const dueCutoff = addDays(startOfDay(/* @__PURE__ */ new Date()), 1);
    const reviews = await prisma.topicReview.findMany({
      where: { userId, completedAt: null, scheduledFor: { lt: dueCutoff } },
      orderBy: { scheduledFor: "asc" },
      include: {
        syllabusItem: {
          select: { id: true, topic: true, discipline: true, contest: { select: { id: true, name: true } } }
        }
      }
    });
    const today = startOfDay(/* @__PURE__ */ new Date());
    return reviews.map((r) => ({
      id: r.id,
      index: r.index,
      intervalDays: r.intervalDays,
      scheduledFor: r.scheduledFor,
      overdue: startOfDay(r.scheduledFor) < today,
      syllabusItemId: r.syllabusItem.id,
      topic: r.syllabusItem.topic,
      discipline: r.syllabusItem.discipline,
      contestId: r.syllabusItem.contest.id,
      contestName: r.syllabusItem.contest.name
    }));
  }
};

// apps/backend/src/controllers/contest.controller.ts
var ContestController = class {
  constructor(service15, reviewService2) {
    this.service = service15;
    this.reviewService = reviewService2;
  }
  service;
  reviewService;
  create = async (req, res, next) => {
    try {
      const contest = await this.service.create(getUserId(req), req.body);
      const response = { success: true, data: contest };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  createFromEdital = async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) {
        throw new AppError(400, "MISSING_FILE", "Envie o PDF do edital.");
      }
      const focus = typeof req.body?.focus === "string" ? req.body.focus : void 0;
      const contest = await this.service.createFromEdital(
        getUserId(req),
        {
          originalname: file.originalname,
          mimetype: file.mimetype,
          path: file.path
        },
        focus
      );
      const response = { success: true, data: contest };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  getTopicContent = async (req, res, next) => {
    try {
      const content = await this.service.getTopicContent(getUserId(req), req.params.itemId);
      const response = { success: true, data: content };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  list = async (req, res, next) => {
    try {
      const contests = await this.service.listByUser(getUserId(req));
      const response = { success: true, data: contests };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  getById = async (req, res, next) => {
    try {
      const contest = await this.service.getById(getUserId(req), req.params.id);
      const response = { success: true, data: contest };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  update = async (req, res, next) => {
    try {
      const contest = await this.service.update(getUserId(req), req.params.id, req.body);
      const response = { success: true, data: contest };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  delete = async (req, res, next) => {
    try {
      await this.service.delete(getUserId(req), req.params.id);
      const response = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  updateSyllabusItem = async (req, res, next) => {
    try {
      const item = await this.service.updateSyllabusItem(
        getUserId(req),
        req.params.itemId,
        req.body.studied
      );
      const response = { success: true, data: item };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  setImportance = async (req, res, next) => {
    try {
      const contest = await this.service.setImportance(
        getUserId(req),
        req.params.id,
        req.body.discipline,
        req.body.importance
      );
      const response = { success: true, data: contest };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  completeReview = async (req, res, next) => {
    try {
      const review = await this.reviewService.complete(
        getUserId(req),
        req.params.reviewId,
        req.body.completed
      );
      const response = { success: true, data: review };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  listDueReviews = async (req, res, next) => {
    try {
      const reviews = await this.reviewService.listDue(getUserId(req));
      const response = { success: true, data: reviews };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
};

// apps/backend/src/validators/contest.validators.ts
import { z as z9 } from "zod";
var createContestSchema = z9.object({
  body: z9.object({
    name: z9.string().min(3).max(200),
    organization: z9.string().max(200).optional(),
    examBoard: z9.string().max(100).optional(),
    role: z9.string().max(200).optional(),
    examDate: z9.string().datetime().or(z9.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional()
  })
});
var updateContestSchema = z9.object({
  body: z9.object({
    name: z9.string().min(3).max(200).optional(),
    organization: z9.string().max(200).nullable().optional(),
    examBoard: z9.string().max(100).nullable().optional(),
    role: z9.string().max(200).nullable().optional(),
    examDate: z9.string().datetime().or(z9.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
    status: z9.enum(["PLANNED", "STUDYING", "DONE", "ARCHIVED"]).optional()
  })
});
var updateSyllabusItemSchema = z9.object({
  body: z9.object({
    studied: z9.boolean()
  })
});
var setImportanceSchema = z9.object({
  body: z9.object({
    discipline: z9.string().min(1).max(200),
    importance: z9.number().int().min(1).max(10)
  })
});
var completeReviewSchema = z9.object({
  body: z9.object({
    completed: z9.boolean()
  })
});

// apps/backend/src/routes/contest.routes.ts
var router12 = Router12();
var aiProvider3 = createAIProvider();
var service11 = new ContestService(aiProvider3);
var reviewService = new ContestReviewService();
var controller11 = new ContestController(service11, reviewService);
router12.post("/", authMiddleware, validateRequest(createContestSchema), controller11.create);
router12.post("/from-edital", authMiddleware, upload.single("file"), controller11.createFromEdital);
router12.get("/", authMiddleware, controller11.list);
router12.get("/reviews/due", authMiddleware, controller11.listDueReviews);
router12.post(
  "/reviews/:reviewId/complete",
  authMiddleware,
  validateRequest(completeReviewSchema),
  controller11.completeReview
);
router12.get("/:id", authMiddleware, controller11.getById);
router12.patch("/:id", authMiddleware, validateRequest(updateContestSchema), controller11.update);
router12.patch("/:id/importance", authMiddleware, validateRequest(setImportanceSchema), controller11.setImportance);
router12.delete("/:id", authMiddleware, controller11.delete);
router12.patch(
  "/syllabus/:itemId",
  authMiddleware,
  validateRequest(updateSyllabusItemSchema),
  controller11.updateSyllabusItem
);
router12.get("/syllabus/:itemId/content", authMiddleware, controller11.getTopicContent);

// apps/backend/src/routes/study-task.routes.ts
import { Router as Router13 } from "express";

// apps/backend/src/services/study-task.service.ts
var REVIEW_DURATION = 15;
var ESSAY_DURATION = 90;
var FINAL_REVIEW_RATIO = 0.15;
var SPACED_REVIEW_OFFSETS = [3, 7];
var WEAK_REVIEW_OFFSETS = [3, 7, 14];
var WEAK_ACCURACY_THRESHOLD = 0.6;
var MIN_ATTEMPTS_FOR_FEEDBACK = 5;
var StudyTaskService = class {
  async generatePlan(userId, dto) {
    const contest = await prisma.contest.findUnique({
      where: { id: dto.contestId },
      include: { syllabus: { where: { studied: false, focus: true }, orderBy: { order: "asc" } } }
    });
    if (!contest || contest.userId !== userId) {
      throw new AppError(404, "CONTEST_NOT_FOUND", "Concurso n\xE3o encontrado");
    }
    if (!contest.examDate || contest.examDate <= /* @__PURE__ */ new Date()) {
      throw new AppError(400, "EXAM_DATE_REQUIRED", "O concurso precisa de uma data de prova futura para gerar o plano.");
    }
    if (contest.syllabus.length === 0) {
      throw new AppError(400, "NO_TOPICS", "N\xE3o h\xE1 t\xF3picos pendentes no conte\xFAdo program\xE1tico deste concurso.");
    }
    const studyDates = buildStudyDates(contest.examDate, dto.studyWeekdays);
    if (studyDates.length < 3) {
      throw new AppError(400, "NOT_ENOUGH_DAYS", "N\xE3o h\xE1 dias de estudo suficientes at\xE9 a prova.");
    }
    const topics = interleaveByDiscipline(contest.syllabus);
    const weakDisciplines = await getWeakDisciplines(userId);
    const tasks = buildTasks(contest.id, contest.name, studyDates, topics, dto.minutesPerDay, weakDisciplines);
    await prisma.studyTask.deleteMany({ where: { userId, contestId: contest.id } });
    await prisma.studyTask.createMany({
      data: tasks.map((t) => ({ ...t, userId }))
    });
    return { created: tasks.length, firstDay: studyDates[0], examDate: contest.examDate };
  }
  async list(userId, from, to) {
    return prisma.studyTask.findMany({
      where: {
        userId,
        ...from || to ? {
          date: {
            ...from ? { gte: /* @__PURE__ */ new Date(`${from}T00:00:00`) } : {},
            ...to ? { lte: /* @__PURE__ */ new Date(`${to}T23:59:59`) } : {}
          }
        } : {}
      },
      orderBy: [{ date: "asc" }, { type: "asc" }]
    });
  }
  async today(userId) {
    const start = /* @__PURE__ */ new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return prisma.studyTask.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { type: "asc" }
    });
  }
  async setCompleted(userId, taskId, completed) {
    const task = await prisma.studyTask.findUnique({ where: { id: taskId } });
    if (!task || task.userId !== userId) {
      throw new AppError(404, "TASK_NOT_FOUND", "Tarefa n\xE3o encontrada");
    }
    const updated = await prisma.studyTask.update({
      where: { id: taskId },
      data: { completed }
    });
    if (task.type === "STUDY" && task.syllabusItemId) {
      await prisma.contestSyllabusItem.update({ where: { id: task.syllabusItemId }, data: { studied: completed } }).catch(() => {
      });
    }
    return updated;
  }
  async clearPlan(userId, contestId) {
    await prisma.studyTask.deleteMany({ where: { userId, contestId } });
  }
};
async function getWeakDisciplines(userId) {
  const attempts = await prisma.questionAttempt.findMany({
    where: { userId },
    select: {
      isCorrect: true,
      question: {
        select: {
          subject: { select: { name: true, parent: { select: { name: true } } } }
        }
      }
    }
  });
  const stats = /* @__PURE__ */ new Map();
  for (const attempt of attempts) {
    const name = (attempt.question.subject.parent?.name ?? attempt.question.subject.name).toLowerCase();
    const entry = stats.get(name) ?? { total: 0, correct: 0 };
    entry.total += 1;
    if (attempt.isCorrect) entry.correct += 1;
    stats.set(name, entry);
  }
  const weak = /* @__PURE__ */ new Set();
  for (const [name, { total, correct }] of stats) {
    if (total >= MIN_ATTEMPTS_FOR_FEEDBACK && correct / total < WEAK_ACCURACY_THRESHOLD) {
      weak.add(name);
    }
  }
  return weak;
}
function buildStudyDates(examDate, weekdays) {
  const allowed = new Set(weekdays);
  const dates = [];
  const cursor = /* @__PURE__ */ new Date();
  cursor.setHours(12, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);
  const limit = new Date(examDate.getUTCFullYear(), examDate.getUTCMonth(), examDate.getUTCDate());
  while (cursor < limit) {
    if (allowed.has(cursor.getDay())) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}
function interleaveByDiscipline(items) {
  const groups = /* @__PURE__ */ new Map();
  for (const item of items) {
    const list = groups.get(item.discipline) ?? [];
    list.push(item);
    groups.set(item.discipline, list);
  }
  const queues = Array.from(groups.values());
  const result = [];
  let added = true;
  while (added) {
    added = false;
    for (const queue of queues) {
      const next = queue.shift();
      if (next) {
        result.push(next);
        added = true;
      }
    }
  }
  return result;
}
function buildTasks(contestId, contestName, studyDates, topics, minutesPerDay, weakDisciplines) {
  const finalDays = Math.max(2, Math.floor(studyDates.length * FINAL_REVIEW_RATIO));
  const learningDates = studyDates.slice(0, studyDates.length - finalDays);
  const reviewDates = studyDates.slice(studyDates.length - finalDays);
  const dateKeys = new Set(studyDates.map(dayKey));
  const tasks = [];
  const topicsPerDay = Math.max(1, Math.ceil(topics.length / learningDates.length));
  const studyDuration = Math.max(20, Math.floor(minutesPerDay / topicsPerDay));
  topics.forEach((topic, index) => {
    const date = learningDates[Math.min(Math.floor(index / topicsPerDay), learningDates.length - 1)];
    tasks.push(makeTask(contestId, "STUDY", date, `Estudar: ${topic.topic}`, topic.discipline, studyDuration, topic.id));
    const isWeak = weakDisciplines.has(topic.discipline.toLowerCase());
    const offsets = isWeak ? WEAK_REVIEW_OFFSETS : SPACED_REVIEW_OFFSETS;
    for (const offset of offsets) {
      const reviewDate = addDays2(date, offset);
      if (dateKeys.has(dayKey(reviewDate)) && reviewDate < reviewDates[0]) {
        const prefix = isWeak ? "Refor\xE7ar" : "Revisar";
        tasks.push(makeTask(contestId, "REVIEW", reviewDate, `${prefix}: ${topic.topic}`, topic.discipline, REVIEW_DURATION, topic.id));
      }
    }
  });
  learningDates.forEach((date, index) => {
    if ((index + 1) % 6 === 0) {
      tasks.push(makeTask(contestId, "ESSAY", date, "Escrever reda\xE7\xE3o da semana", null, ESSAY_DURATION, null));
    }
  });
  reviewDates.forEach((date, index) => {
    const isLast = index === reviewDates.length - 1;
    tasks.push(
      isLast ? makeTask(contestId, "MOCK_EXAM", date, `Simulado final \u2014 ${contestName}`, null, minutesPerDay, null) : makeTask(contestId, "REVIEW", date, "Revis\xE3o geral do conte\xFAdo", null, minutesPerDay, null)
    );
  });
  return tasks;
}
function makeTask(contestId, type, date, title, discipline, duration, syllabusItemId) {
  return { contestId, type, date, title: title.slice(0, 190), discipline, duration, syllabusItemId };
}
function addDays2(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

// apps/backend/src/controllers/study-task.controller.ts
var StudyTaskController = class {
  constructor(service15) {
    this.service = service15;
  }
  service;
  generatePlan = async (req, res, next) => {
    try {
      const result = await this.service.generatePlan(getUserId(req), req.body);
      const response = { success: true, data: result };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  list = async (req, res, next) => {
    try {
      const tasks = await this.service.list(
        getUserId(req),
        req.query.from,
        req.query.to
      );
      const response = { success: true, data: tasks };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  today = async (req, res, next) => {
    try {
      const tasks = await this.service.today(getUserId(req));
      const response = { success: true, data: tasks };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  update = async (req, res, next) => {
    try {
      const task = await this.service.setCompleted(
        getUserId(req),
        req.params.id,
        req.body.completed
      );
      const response = { success: true, data: task };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  clearPlan = async (req, res, next) => {
    try {
      await this.service.clearPlan(getUserId(req), req.params.contestId);
      const response = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
};

// apps/backend/src/validators/study-task.validators.ts
import { z as z10 } from "zod";
var generatePlanSchema = z10.object({
  body: z10.object({
    contestId: z10.string().min(1),
    minutesPerDay: z10.number().int().min(30).max(720).default(120),
    studyWeekdays: z10.array(z10.number().int().min(0).max(6)).min(1).default([1, 2, 3, 4, 5, 6])
  })
});
var listTasksSchema = z10.object({
  query: z10.object({
    from: z10.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z10.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  })
});
var updateTaskSchema = z10.object({
  body: z10.object({
    completed: z10.boolean()
  })
});

// apps/backend/src/routes/study-task.routes.ts
var router13 = Router13();
var service12 = new StudyTaskService();
var controller12 = new StudyTaskController(service12);
router13.post("/generate", authMiddleware, validateRequest(generatePlanSchema), controller12.generatePlan);
router13.get("/", authMiddleware, validateRequest(listTasksSchema), controller12.list);
router13.get("/today", authMiddleware, controller12.today);
router13.patch("/:id", authMiddleware, validateRequest(updateTaskSchema), controller12.update);
router13.delete("/contest/:contestId", authMiddleware, controller12.clearPlan);

// apps/backend/src/routes/dashboard.routes.ts
import { Router as Router14 } from "express";

// apps/backend/src/services/dashboard.service.ts
var HEATMAP_DAYS = 182;
function dateKey(date) {
  const d = startOfDay(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}
var DashboardService = class {
  async getSummary(userId) {
    const [streak, heatmap, goal, averages] = await Promise.all([
      this.getStreak(userId),
      this.buildHeatmap(userId),
      this.buildGoal(userId),
      this.buildAverages(userId)
    ]);
    return { streak, heatmap, goal, averages };
  }
  async setDailyGoal(userId, dailyGoal) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { dailyGoal },
      select: { dailyGoal: true }
    });
    return { dailyGoal: user.dailyGoal };
  }
  async getStreak(userId) {
    const streak = await prisma.streak.findUnique({ where: { userId } });
    return { current: streak?.current ?? 0, longest: streak?.longest ?? 0 };
  }
  async buildHeatmap(userId) {
    const since = addDays(startOfDay(/* @__PURE__ */ new Date()), -HEATMAP_DAYS);
    const [attempts, reviews] = await Promise.all([
      prisma.questionAttempt.findMany({
        where: { userId, createdAt: { gte: since } },
        select: { createdAt: true }
      }),
      prisma.topicReview.findMany({
        where: { userId, completedAt: { gte: since } },
        select: { completedAt: true }
      })
    ]);
    const counts = /* @__PURE__ */ new Map();
    for (const a of attempts) counts.set(dateKey(a.createdAt), (counts.get(dateKey(a.createdAt)) ?? 0) + 1);
    for (const r of reviews) {
      if (r.completedAt) counts.set(dateKey(r.completedAt), (counts.get(dateKey(r.completedAt)) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
  }
  async buildGoal(userId) {
    const today = startOfDay(/* @__PURE__ */ new Date());
    const [user, attempts] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { dailyGoal: true } }),
      prisma.questionAttempt.findMany({
        where: { userId, createdAt: { gte: today } },
        select: { timeSpent: true }
      })
    ]);
    const studyMinutes = Math.round(attempts.reduce((sum, a) => sum + a.timeSpent, 0) / 60);
    return {
      dailyQuestions: user?.dailyGoal ?? 30,
      todayQuestions: attempts.length,
      todayStudyMinutes: studyMinutes
    };
  }
  async buildAverages(userId) {
    const since30 = addDays(startOfDay(/* @__PURE__ */ new Date()), -30);
    const since7 = addDays(startOfDay(/* @__PURE__ */ new Date()), -7);
    const attempts = await prisma.questionAttempt.findMany({
      where: { userId, createdAt: { gte: since30 } },
      select: { createdAt: true }
    });
    const last7 = attempts.filter((a) => a.createdAt >= since7).length;
    const activeDays = new Set(attempts.map((a) => dateKey(a.createdAt))).size;
    const perActiveDay = activeDays > 0 ? Math.round(attempts.length / activeDays) : 0;
    return {
      questionsLast30: attempts.length,
      questionsLast7: last7,
      activeDaysLast30: activeDays,
      perActiveDay
    };
  }
};

// apps/backend/src/controllers/dashboard.controller.ts
var DashboardController = class {
  constructor(service15) {
    this.service = service15;
  }
  service;
  getSummary = async (req, res, next) => {
    try {
      const summary = await this.service.getSummary(getUserId(req));
      const response = { success: true, data: summary };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  setDailyGoal = async (req, res, next) => {
    try {
      const result = await this.service.setDailyGoal(getUserId(req), req.body.dailyGoal);
      const response = { success: true, data: result };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
};

// apps/backend/src/validators/dashboard.validators.ts
import { z as z11 } from "zod";
var setDailyGoalSchema = z11.object({
  body: z11.object({
    dailyGoal: z11.number().int().min(1).max(500)
  })
});

// apps/backend/src/routes/dashboard.routes.ts
var router14 = Router14();
var service13 = new DashboardService();
var controller13 = new DashboardController(service13);
router14.get("/", authMiddleware, controller13.getSummary);
router14.patch("/daily-goal", authMiddleware, validateRequest(setDailyGoalSchema), controller13.setDailyGoal);

// apps/backend/src/routes/payment.routes.ts
import { Router as Router15, raw } from "express";

// apps/backend/src/services/payment.service.ts
var ACTIVE_EVENTS = ["paid", "approved", "order_approved", "completed", "active", "subscription_renewed", "subscription_active"];
var INACTIVE_EVENTS = {
  refunded: "REFUNDED",
  chargedback: "REFUNDED",
  chargeback: "REFUNDED",
  canceled: "CANCELED",
  cancelled: "CANCELED",
  subscription_canceled: "CANCELED",
  subscription_late: "EXPIRED",
  expired: "EXPIRED"
};
function unknown(value) {
  return value && typeof value === "object" ? value : {};
}
function pickEmail(payload) {
  const customer = unknown(payload.Customer ?? payload.customer ?? payload.buyer);
  const email = customer.email ?? payload.email ?? payload.Email;
  return email ? email.toLowerCase().trim() : null;
}
function pickEvent(payload) {
  const sub = unknown(payload.Subscription ?? payload.subscription);
  const raw2 = payload.order_status ?? payload.webhook_event_type ?? payload.event ?? sub.status ?? "";
  return String(raw2).toLowerCase().trim();
}
function mapStatus(event) {
  if (ACTIVE_EVENTS.includes(event)) return "ACTIVE";
  if (event in INACTIVE_EVENTS) return INACTIVE_EVENTS[event];
  return null;
}
var PaymentService = class {
  async handleKiwifyWebhook(payload) {
    const email = pickEmail(payload);
    const event = pickEvent(payload);
    const status = mapStatus(event);
    if (!email || !status) {
      return { handled: false, email, event };
    }
    const product = unknown(payload.Product ?? payload.product);
    const externalRef = payload.order_id ?? payload.order_ref ?? payload.id ?? null;
    const productId = product.product_id ?? product.id ?? null;
    await prisma.entitlement.upsert({
      where: { email },
      create: { email, status, provider: "kiwify", externalRef, productId },
      update: { status, externalRef, productId }
    });
    return { handled: true, email, event, status };
  }
  async getAccess(email) {
    const normalized = email.toLowerCase().trim();
    const entitlement = await prisma.entitlement.findUnique({ where: { email: normalized } });
    const now = /* @__PURE__ */ new Date();
    const active = !!entitlement && entitlement.status === "ACTIVE" && (!entitlement.expiresAt || entitlement.expiresAt > now);
    return {
      active,
      enforced: env.REQUIRE_SUBSCRIPTION,
      status: entitlement?.status ?? "NONE",
      expiresAt: entitlement?.expiresAt ?? null,
      checkoutUrl: env.KIWIFY_CHECKOUT_URL
    };
  }
};

// apps/backend/src/utils/kiwify-signature.ts
import crypto4 from "node:crypto";
function verifyKiwifySignature(rawBody, signature, token) {
  if (!signature) return false;
  const expected = crypto4.createHmac("sha1", token).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto4.timingSafeEqual(a, b);
}

// apps/backend/src/controllers/payment.controller.ts
var PaymentController = class {
  constructor(service15) {
    this.service = service15;
  }
  service;
  kiwifyWebhook = async (req, res) => {
    const raw2 = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));
    if (env.KIWIFY_WEBHOOK_TOKEN) {
      const signature = req.query.signature ?? req.headers["x-kiwify-signature"];
      if (!verifyKiwifySignature(raw2, signature, env.KIWIFY_WEBHOOK_TOKEN)) {
        return res.status(401).json({ success: false, error: { message: "Assinatura inv\xE1lida", code: "INVALID_SIGNATURE" } });
      }
    }
    let payload = {};
    try {
      payload = JSON.parse(raw2.toString("utf8"));
    } catch {
      payload = {};
    }
    const result = await this.service.handleKiwifyWebhook(payload);
    console.log("[kiwify-webhook]", JSON.stringify(result));
    return res.status(200).json({ success: true, data: result });
  };
  myAccess = async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: getUserId(req) },
        select: { email: true }
      });
      const access = await this.service.getAccess(user?.email ?? "");
      const response = { success: true, data: access };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
};

// apps/backend/src/routes/payment.routes.ts
var router15 = Router15();
var service14 = new PaymentService();
var controller14 = new PaymentController(service14);
router15.post("/kiwify/webhook", raw({ type: "*/*" }), controller14.kiwifyWebhook);
router15.get("/me", authMiddleware, controller14.myAccess);

// apps/backend/src/middlewares/subscription.middleware.ts
async function requireSubscription(req, res, next) {
  if (!env.REQUIRE_SUBSCRIPTION) {
    return next();
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: getUserId(req) },
      select: { email: true, role: true }
    });
    if (user?.role === "ADMIN") {
      return next();
    }
    const entitlement = user ? await prisma.entitlement.findUnique({ where: { email: user.email.toLowerCase() } }) : null;
    const active = !!entitlement && entitlement.status === "ACTIVE" && (!entitlement.expiresAt || entitlement.expiresAt > /* @__PURE__ */ new Date());
    if (active) {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: { message: "Assinatura necess\xE1ria para acessar este recurso.", code: "SUBSCRIPTION_REQUIRED" }
    });
  } catch (error) {
    next(error);
  }
}

// apps/backend/src/routes/index.ts
var router16 = Router16();
var gate = [authMiddleware, requireSubscription];
router16.use("/auth", router);
router16.use("/payments", router15);
router16.use("/subjects", router2);
router16.use("/exam-boards", router3);
router16.use("/gamification", router9);
router16.use("/groups", router10);
router16.use("/questions", gate, router4);
router16.use("/study", gate, router5);
router16.use("/documents", gate, router6);
router16.use("/study-plans", gate, router7);
router16.use("/flashcards", gate, router8);
router16.use("/essays", gate, router11);
router16.use("/contests", gate, router12);
router16.use("/study-tasks", gate, router13);
router16.use("/dashboard", gate, router14);
router16.get("/health", (_req, res) => {
  const response = {
    success: true,
    data: {
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
  res.json(response);
});

// apps/backend/src/server.ts
function applyMigrations() {
  try {
    const out = execSync(
      `"${process.execPath}" node_modules/prisma/build/index.js db push --schema prisma/schema.prisma --accept-data-loss --skip-generate`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    );
    console.log("Migrations aplicadas com sucesso:\n", out);
  } catch (error) {
    const e = error;
    console.error("Falha ao aplicar migrations.");
    console.error("STDOUT:", e.stdout ?? "");
    console.error("STDERR:", e.stderr ?? "");
    console.error("MSG:", e.message ?? "");
  }
}
if (env.NODE_ENV === "production") {
  applyMigrations();
}
var app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(
  rateLimit2({
    windowMs: RATE_LIMIT.GENERAL_WINDOW_MS,
    max: RATE_LIMIT.GENERAL_MAX,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use(express.json({ limit: "10mb" }));
var uploadsDir = path3.resolve("uploads");
fs5.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));
app.use("/api", router16);
var publicDir = path3.resolve("public");
if (fs5.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path3.join(publicDir, "index.html"));
  });
}
app.use(errorHandler);
var server = app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
server.requestTimeout = 66e4;
export {
  app
};
