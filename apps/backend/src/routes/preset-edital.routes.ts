import { type Router as RouterType, Router } from 'express';

import { PresetEditalController } from '../controllers/preset-edital.controller.js';
import { validateRequest } from '../middlewares/validate.js';
import { PresetEditalService } from '../services/preset-edital.service.js';
import { createFromPresetSchema } from '../validators/preset-edital.validators.js';

const router: RouterType = Router();
const controller = new PresetEditalController(new PresetEditalService());

router.get('/', controller.list);
router.post('/', validateRequest(createFromPresetSchema), controller.create);

export { router as presetEditalRouter };
