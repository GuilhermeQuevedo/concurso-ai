-- CreateIndex
CREATE INDEX `Question_source_organ_idx` ON `Question`(`source`, `organ`);

-- CreateIndex
CREATE INDEX `Question_source_position_idx` ON `Question`(`source`, `position`);
