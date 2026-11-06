-- CreateIndex
CREATE INDEX `Contest_userId_createdAt_idx` ON `Contest`(`userId`, `createdAt`);

-- CreateIndex
CREATE INDEX `Contest_userId_status_idx` ON `Contest`(`userId`, `status`);

-- CreateIndex
CREATE INDEX `Entitlement_status_idx` ON `Entitlement`(`status`);

-- CreateIndex
CREATE INDEX `Question_subjectId_difficulty_idx` ON `Question`(`subjectId`, `difficulty`);

-- CreateIndex
CREATE INDEX `QuestionAttempt_userId_isCorrect_idx` ON `QuestionAttempt`(`userId`, `isCorrect`);

-- CreateIndex
CREATE INDEX `QuestionAttempt_userId_questionId_idx` ON `QuestionAttempt`(`userId`, `questionId`);

-- CreateIndex
CREATE INDEX `QuestionSet_userId_lastAttemptAt_createdAt_idx` ON `QuestionSet`(`userId`, `lastAttemptAt`, `createdAt`);

-- CreateIndex
CREATE INDEX `TopicReview_userId_completedAt_idx` ON `TopicReview`(`userId`, `completedAt`);
