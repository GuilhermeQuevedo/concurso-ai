import { type Router as RouterType, Router } from 'express';

import { QuestionBankController } from '../controllers/question-bank.controller.js';
import { validateRequest } from '../middlewares/validate.js';
import { QuestionBankService } from '../services/question-bank.service.js';
import { buildBankSetSchema } from '../validators/question-bank.validators.js';

const router: RouterType = Router();
const controller = new QuestionBankController(new QuestionBankService());

router.get('/facets', controller.facets);
router.get('/count', controller.count);
router.post('/set', validateRequest(buildBankSetSchema), controller.buildSet);

export { router as questionBankRouter };
