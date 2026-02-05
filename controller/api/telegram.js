const Telegram = require('../../model/Telegram');
const Range = require('../../model/Range');
const TelegramRange = require('../../model/TelegramRange');

class TelegramController {
    // Get all telegram chats
    static async getTelegramChats(req, res) {
        try {
            const chats = await Telegram.find();
            res.json(chats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get all ranges
    static async getRanges(req, res) {
        try {
            const ranges = await Range.find();
            res.json(ranges);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Add new telegram chat
    static async addTelegramChat(req, res) {
        try {
            const { chatId, name } = req.body;

            // Check if chatId already exists
            const existingChat = await Telegram.findOne({ chatId });
            if (existingChat) {
                return res
                    .status(400)
                    .json({ error: 'Chat ID already exists' });
            }

            const telegram = new Telegram({ chatId, name });
            await telegram.save();
            res.status(201).json(telegram);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // Update telegram chat
    static async updateTelegramChat(req, res) {
        try {
            const { id } = req.params;
            const { chatId, name } = req.body;

            // Check if chatId already exists (excluding current)
            const existingChat = await Telegram.findOne({
                chatId,
                _id: { $ne: id },
            });
            if (existingChat) {
                return res
                    .status(400)
                    .json({ error: 'Chat ID already exists' });
            }

            const telegram = await Telegram.findByIdAndUpdate(
                id,
                { chatId, name },
                { new: true, runValidators: true },
            );

            if (!telegram) {
                return res
                    .status(404)
                    .json({ error: 'Telegram chat not found' });
            }

            res.json(telegram);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // Delete telegram chat
    static async deleteTelegramChat(req, res) {
        try {
            const { id } = req.params;

            // First, delete all assignments for this telegram
            await TelegramRange.deleteMany({ telegramId: id });

            const telegram = await Telegram.findByIdAndDelete(id);
            if (!telegram) {
                return res
                    .status(404)
                    .json({ error: 'Telegram chat not found' });
            }

            res.json({ message: 'Telegram chat deleted successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // Add new range
    static async addRange(req, res) {
        try {
            const { name, start, end } = req.body;
            const range = new Range({ name, start, end });
            await range.save();
            res.status(201).json(range);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // Update range
    static async updateRange(req, res) {
        try {
            const { id } = req.params;
            const { name, start, end } = req.body;

            const range = await Range.findByIdAndUpdate(
                id,
                { name, start, end },
                { new: true, runValidators: true },
            );

            if (!range) {
                return res.status(404).json({ error: 'Range not found' });
            }

            res.json(range);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // Delete range
    static async deleteRange(req, res) {
        try {
            const { id } = req.params;

            // First, delete all assignments for this range
            await TelegramRange.deleteMany({ rangeId: id });

            const range = await Range.findByIdAndDelete(id);
            if (!range) {
                return res.status(404).json({ error: 'Range not found' });
            }

            res.json({ message: 'Range deleted successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // Assign ranges to telegram
    static async assignRangesToTelegram(req, res) {
        try {
            const { telegramId, rangeIds } = req.body;

            // Validate telegram exists
            const telegram = await Telegram.findById(telegramId);
            if (!telegram) {
                return res
                    .status(404)
                    .json({ error: 'Telegram chat not found' });
            }

            // Validate all ranges exist
            const ranges = await Range.find({ _id: { $in: rangeIds } });
            if (ranges.length !== rangeIds.length) {
                return res
                    .status(400)
                    .json({ error: 'One or more ranges not found' });
            }

            // Delete existing assignments for this telegram
            await TelegramRange.deleteMany({ telegramId });

            // Create new assignments
            const assignments = rangeIds.map((rangeId) => ({
                telegramId,
                rangeId,
            }));

            const createdAssignments =
                await TelegramRange.insertMany(assignments);

            res.json({
                message: 'Assignments saved successfully',
                count: createdAssignments.length,
                assignments: createdAssignments,
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // Get assignments for a telegram
    static async getAssignments(req, res) {
        try {
            const { telegramId } = req.params;

            const assignments = await TelegramRange.find({ telegramId })
                .populate('rangeId', 'name start end')
                .populate('telegramId', 'name chatId');

            res.json(assignments);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get telegram with assigned ranges
    static async getTelegramWithRanges(req, res) {
        try {
            const { telegramId } = req.params;

            const telegram = await Telegram.findById(telegramId);
            if (!telegram) {
                return res
                    .status(404)
                    .json({ error: 'Telegram chat not found' });
            }

            const assignments = await TelegramRange.find({
                telegramId,
            }).populate('rangeId', 'name start end');

            const telegramWithRanges = {
                ...telegram.toObject(),
                assignedRanges: assignments.map((a) => a.rangeId),
            };

            res.json(telegramWithRanges);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get all assignments grouped by telegram
    static async getAllAssignments(req, res) {
        try {
            const assignments = await TelegramRange.find()
                .populate('telegramId', 'name chatId')
                .populate('rangeId', 'name start end');

            // Group by telegram
            const grouped = {};
            assignments.forEach((assignment) => {
                const telegramId = assignment.telegramId._id.toString();
                if (!grouped[telegramId]) {
                    grouped[telegramId] = {
                        telegram: assignment.telegramId,
                        ranges: [],
                    };
                }
                grouped[telegramId].ranges.push(assignment.rangeId);
            });

            res.json(Object.values(grouped));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Check if range is assigned to any telegram
    static async checkRangeAssignment(req, res) {
        try {
            const { rangeId } = req.params;

            const assignments = await TelegramRange.find({ rangeId }).populate(
                'telegramId',
                'name chatId',
            );

            res.json({
                rangeId,
                isAssigned: assignments.length > 0,
                assignedTo: assignments.map((a) => a.telegramId),
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Thêm vào controller/telegramController.js

    // Get all assignments grouped by telegram
    static async getAllAssignments(req, res) {
        try {
            const assignments = await TelegramRange.find()
                .populate('telegramId', 'name chatId')
                .populate('rangeId', 'name start end');

            // Group by telegram
            const grouped = {};
            assignments.forEach((assignment) => {
                const telegramId = assignment.telegramId._id.toString();
                if (!grouped[telegramId]) {
                    grouped[telegramId] = {
                        telegram: assignment.telegramId,
                        ranges: [],
                    };
                }
                grouped[telegramId].ranges.push(assignment.rangeId);
            });

            res.json(Object.values(grouped));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get telegram with assigned ranges
    static async getTelegramWithRanges(req, res) {
        try {
            const { telegramId } = req.params;

            const telegram = await Telegram.findById(telegramId);
            if (!telegram) {
                return res
                    .status(404)
                    .json({ error: 'Telegram chat not found' });
            }

            const assignments = await TelegramRange.find({
                telegramId,
            }).populate('rangeId', 'name start end');

            const telegramWithRanges = {
                ...telegram.toObject(),
                assignedRanges: assignments.map((a) => a.rangeId),
            };

            res.json(telegramWithRanges);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = TelegramController;
