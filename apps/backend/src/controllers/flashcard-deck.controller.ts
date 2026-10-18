import type { Request, Response, NextFunction } from 'express';

import type { ApiResponse } from '@concurso-ai/types';
import type { FlashcardDeckService } from '../services/flashcard-deck.service.js';
import { getUserId } from '../utils/request.js';

type Handler = (req: Request) => Promise<unknown>;

export class FlashcardDeckController {
  constructor(private readonly service: FlashcardDeckService) {}

  private handle =
    (action: Handler, status = 200) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await action(req);
        const response: ApiResponse<unknown> = { success: true, data: data ?? null };
        res.status(status).json(response);
      } catch (error) {
        next(error);
      }
    };

  private id = (req: Request) => req.params.id as string;

  list = this.handle((req) => this.service.list(getUserId(req)));
  create = this.handle((req) => this.service.create(getUserId(req), req.body), 201);
  generate = this.handle((req) => this.service.generate(getUserId(req), req.body), 201);
  update = this.handle((req) => this.service.update(getUserId(req), this.id(req), req.body));
  remove = this.handle((req) => this.service.remove(getUserId(req), this.id(req)));
  cards = this.handle((req) => this.service.cards(getUserId(req), this.id(req)));
  addCard = this.handle((req) => this.service.addCard(getUserId(req), this.id(req), req.body), 201);
  updateCard = this.handle((req) => this.service.updateCard(getUserId(req), this.id(req), req.body));
  importCards = this.handle((req) => this.service.importCards(getUserId(req), this.id(req), req.body.text), 201);
  study = this.handle((req) => this.service.study(getUserId(req), this.id(req), req.query.all === '1'));
}
