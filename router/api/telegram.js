const express = require('express');
const router = express.Router();
const TelegramController = require('../../controller/api/telegram');

// Telegram Chat Routes
router.get('/chats', TelegramController.getTelegramChats);
router.post('/chats', TelegramController.addTelegramChat);
router.put('/chats/:id', TelegramController.updateTelegramChat);
router.delete('/chats/:id', TelegramController.deleteTelegramChat);

// Range Routes
router.get('/ranges', TelegramController.getRanges);
router.post('/ranges', TelegramController.addRange);
router.put('/ranges/:id', TelegramController.updateRange);
router.delete('/ranges/:id', TelegramController.deleteRange);

// Assignment Routes
router.post('/assign', TelegramController.assignRangesToTelegram);
router.get('/assignments/:telegramId', TelegramController.getAssignments);
router.get(
    '/telegram-with-ranges/:telegramId',
    TelegramController.getTelegramWithRanges,
);
router.get('/all-assignments', TelegramController.getAllAssignments);
router.get('/check-range/:rangeId', TelegramController.checkRangeAssignment);

router.get('/all-assignments', TelegramController.getAllAssignments);
router.get(
    '/telegram-with-ranges/:telegramId',
    TelegramController.getTelegramWithRanges,
);

module.exports = router;
