import express from 'express';
import { body, validationResult } from 'express-validator';
import Guild from '../models/Guild';
import Friendship from '../models/Friendship';
import RaidBoss from '../models/RaidBoss';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   POST /api/guilds
// @desc    Create a new guild
// @access  Private
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 3, max: 30 }).withMessage('Guild name must be between 3 and 30 characters'),
    body('description').optional().trim().isLength({ max: 500 })
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description } = req.body;

      // Check if guild name exists
      const existingGuild = await Guild.findOne({ name });
      if (existingGuild) {
        return next(new AppError('Guild name already exists', 400));
      }

      const guild = await Guild.create({
        name,
        description,
        leader: req.user._id,
        members: [req.user._id]
      });

      res.status(201).json({
        status: 'success',
        guild
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   GET /api/guilds
// @desc    Get all guilds
// @access  Private
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const guilds = await Guild.find()
      .populate('leader', 'username avatar level xp')
      .populate('members', 'username avatar level xp')
      .sort({ totalXP: -1 });

    res.json({
      status: 'success',
      results: guilds.length,
      guilds
    });
  } catch (error: any) {
    next(error);
  }
});

// @route   GET /api/guilds/leaderboard
// @desc    Get leaderboard
// @access  Private
router.get('/leaderboard', async (req: AuthRequest, res, next) => {
  try {
    const users = await User.find()
      .select('username avatar territories xp')
      .sort({ territories: -1, xp: -1 })
      .limit(100);

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      name: user.username,
      territories: user.territories,
      xp: user.xp,
      avatar: user.avatar || user.username.substring(0, 2).toUpperCase()
    }));

    res.json({
      status: 'success',
      leaderboard
    });
  } catch (error: any) {
    next(error);
  }
});

// @route   GET /api/guilds/friends
// @desc    Get user's friends
// @access  Private
router.get('/friends', async (req: AuthRequest, res, next) => {
  try {
    const friendships = await Friendship.find({
      $or: [
        { requester: req.user._id, status: 'accepted' },
        { recipient: req.user._id, status: 'accepted' }
      ]
    })
    .populate('requester', 'username avatar level xp isOnline')
    .populate('recipient', 'username avatar level xp isOnline');

    const friends = friendships.map(friendship => {
      const friend = friendship.requester._id.toString() === req.user._id.toString()
        ? friendship.recipient
        : friendship.requester;
      return {
        id: friend._id,
        name: friend.username,
        avatar: friend.avatar || friend.username.substring(0, 2).toUpperCase(),
        level: friend.level,
        xp: friend.xp,
        online: friend.isOnline
      };
    });

    res.json({
      status: 'success',
      friends
    });
  } catch (error: any) {
    next(error);
  }
});

// @route   POST /api/guilds/friends/request
// @desc    Send friend request
// @access  Private
router.post(
  '/friends/request',
  [
    body('userId').notEmpty().withMessage('User ID is required')
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId } = req.body;

      if (userId === req.user._id.toString()) {
        return next(new AppError('Cannot send friend request to yourself', 400));
      }

      const existingFriendship = await Friendship.findOne({
        $or: [
          { requester: req.user._id, recipient: userId },
          { requester: userId, recipient: req.user._id }
        ]
      });

      if (existingFriendship) {
        if (existingFriendship.status === 'pending') {
          return next(new AppError('Friend request already pending', 400));
        } else if (existingFriendship.status === 'accepted') {
          return next(new AppError('Already friends', 400));
        } else {
          return next(new AppError('Friendship already exists', 400));
        }
      }

      const friendship = await Friendship.create({
        requester: req.user._id,
        recipient: userId,
        status: 'pending'
      });

      res.status(201).json({
        status: 'success',
        friendship
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   GET /api/guilds/friends/requests
// @desc    Get pending friend requests
// @access  Private
router.get('/friends/requests', async (req: AuthRequest, res, next) => {
  try {
    const requests = await Friendship.find({
      recipient: req.user._id,
      status: 'pending'
    })
    .populate('requester', 'username avatar level xp isOnline')
    .sort({ createdAt: -1 });

    const formattedRequests = requests.map(request => ({
      id: request._id,
      user: {
        id: request.requester._id,
        name: request.requester.username,
        avatar: request.requester.avatar || request.requester.username.substring(0, 2).toUpperCase(),
        level: request.requester.level,
        online: request.requester.isOnline
      },
      createdAt: request.createdAt
    }));

    res.json({
      status: 'success',
      requests: formattedRequests
    });
  } catch (error: any) {
    next(error);
  }
});

// @route   PUT /api/guilds/friends/requests/:requestId
// @desc    Accept or reject friend request
// @access  Private
router.put(
  '/friends/requests/:requestId',
  [
    body('action').isIn(['accept', 'reject']).withMessage('Action must be accept or reject')
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { requestId } = req.params;
      const { action } = req.body;

      const friendship = await Friendship.findOne({
        _id: requestId,
        recipient: req.user._id,
        status: 'pending'
      });

      if (!friendship) {
        return next(new AppError('Friend request not found', 404));
      }

      if (action === 'accept') {
        friendship.status = 'accepted';
        await friendship.save();
      } else {
        await friendship.deleteOne();
      }

      res.json({
        status: 'success',
        message: action === 'accept' ? 'Friend request accepted' : 'Friend request rejected'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   DELETE /api/guilds/friends/:friendId
// @desc    Remove a friend
// @access  Private
router.delete('/friends/:friendId', async (req: AuthRequest, res, next) => {
  try {
    const { friendId } = req.params;

    const friendship = await Friendship.findOneAndDelete({
      $or: [
        { requester: req.user._id, recipient: friendId, status: 'accepted' },
        { requester: friendId, recipient: req.user._id, status: 'accepted' }
      ]
    });

    if (!friendship) {
      return next(new AppError('Friendship not found', 404));
    }

    res.json({
      status: 'success',
      message: 'Friend removed successfully'
    });
  } catch (error: any) {
    next(error);
  }
});

// @route   GET /api/guilds/raid-boss
// @desc    Get current raid boss
// @access  Private
router.get('/raid-boss', async (req: AuthRequest, res, next) => {
  try {
    const raidBoss = await RaidBoss.findOne({ isActive: true })
      .sort({ createdAt: -1 });

    if (!raidBoss) {
      return res.json({
        status: 'success',
        raidBoss: null,
        message: 'No active raid boss'
      });
    }

    res.json({
      status: 'success',
      raidBoss: {
        id: raidBoss._id,
        name: raidBoss.name,
        description: raidBoss.description,
        maxHealth: raidBoss.maxHealth,
        currentHealth: raidBoss.currentHealth,
        startTime: raidBoss.startTime,
        endTime: raidBoss.endTime,
        rewards: raidBoss.rewards,
        healthPercentage: (raidBoss.currentHealth / raidBoss.maxHealth) * 100
      }
    });
  } catch (error: any) {
    next(error);
  }
});

// @route   POST /api/guilds/raid-boss/damage
// @desc    Deal damage to raid boss
// @access  Private
router.post(
  '/raid-boss/damage',
  [
    body('damage').isInt({ min: 1 }).withMessage('Damage must be a positive integer')
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { damage } = req.body;

      const raidBoss = await RaidBoss.findOne({ isActive: true });

      if (!raidBoss) {
        return next(new AppError('No active raid boss', 404));
      }

      const newHealth = Math.max(0, raidBoss.currentHealth - damage);
      raidBoss.currentHealth = newHealth;

      if (newHealth === 0) {
        raidBoss.isActive = false;
        // Award rewards logic here
      }

      await raidBoss.save();

      // Award XP to user
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { xp: damage }
      });

      res.json({
        status: 'success',
        raidBoss: {
          currentHealth: raidBoss.currentHealth,
          maxHealth: raidBoss.maxHealth,
          healthPercentage: (raidBoss.currentHealth / raidBoss.maxHealth) * 100
        },
        damageDealt: damage,
        xpGained: damage
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export { router as guildRoutes };