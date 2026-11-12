import { type Router as RouterType, Router } from 'express';

import { ReminderController } from '../controllers/reminder.controller.js';
import { validateRequest } from '../middlewares/validate.js';
import { ReminderRepository } from '../repositories/reminder.repository.js';
import { ReminderService } from '../services/reminder.service.js';
import { createReminderSchema, updateReminderSchema } from '../validators/reminder.validators.js';

const router: RouterType = Router();

const controller = new ReminderController(new ReminderService(new ReminderRepository()));

router.get('/', controller.list);
router.post('/', validateRequest(createReminderSchema), controller.create);
router.patch('/:id', validateRequest(updateReminderSchema), controller.update);
router.delete('/:id', controller.remove);

export { router as reminderRouter };
