import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'default-secret', {
    expiresIn: (process.env.JWT_EXPIRE || '7d') as any
  });
};

// Generate a valid, unique FitQuest username from Google profile
const generateUniqueUsername = async (preferredName?: string, email?: string): Promise<string> => {
  let base = (preferredName || email?.split('@')[0] || 'warrior')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 14);

  if (base.length < 3) {
    base = `user_${base}`.slice(0, 14);
  }

  let candidate = base;
  let exists = await User.findOne({ username: candidate });
  let attempts = 0;

  while (exists && attempts < 10) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    candidate = `${base.slice(0, 20 - randomSuffix.length - 1)}_${randomSuffix}`;
    exists = await User.findOne({ username: candidate });
    attempts++;
  }

  if (exists) {
    candidate = `warrior_${Date.now().toString().slice(-6)}`;
  }

  return candidate;
};

interface GoogleProfile {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
}

// Verify Google credential (ID token), access token, or auth code
const verifyGoogleCredential = async (
  credential?: string,
  accessToken?: string,
  code?: string
): Promise<GoogleProfile> => {
  // 1. If ID token (credential) is provided
  if (credential) {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      throw new AppError('Invalid Google token payload', 400);
    }
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    };
  }

  // 2. If OAuth authorization code is provided
  if (code) {
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'postmessage';
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    const { tokens } = await oauth2Client.getToken(code);
    if (tokens.id_token) {
      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      if (payload && payload.email && payload.sub) {
        return {
          googleId: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture
        };
      }
    }
    if (tokens.access_token) {
      accessToken = tokens.access_token;
    }
  }

  // 3. If access token is provided (or obtained via code)
  if (accessToken) {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      throw new AppError('Failed to fetch user information from Google', 400);
    }
    const info: any = await res.json();
    if (!info || !info.email || !info.sub) {
      throw new AppError('Google profile missing email or sub identifier', 400);
    }
    return {
      googleId: info.sub,
      email: info.email,
      name: info.name,
      picture: info.picture
    };
  }

  throw new AppError('No Google credential, access token, or code provided', 400);
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post(
  '/signup',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Username must be between 3 and 20 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return next(new AppError('User already exists with this email or username', 400));
      }

      // Create user
      const user = await User.create({
        username,
        email,
        password
      });

      // Generate token
      const token = generateToken(user._id.toString());

      res.status(201).json({
        status: 'success',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          level: user.level,
          xp: user.xp,
          stats: user.stats
        }
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user and include password
      const user = await User.findOne({ email }).select('+password');

      if (!user || !(await user.comparePassword(password))) {
        return next(new AppError('Invalid email or password', 401));
      }

      // Mark user online
      await User.findByIdAndUpdate(user._id, {
        isOnline: true,
        lastSeen: new Date()
      });

      // Generate token
      const token = generateToken(user._id.toString());

      res.json({
        status: 'success',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          level: user.level,
          xp: user.xp,
          stats: user.stats
        }
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/auth/google
// @desc    Authenticate with Google OAuth (ID token, access token, or code)
// @access  Public
router.post('/google', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential, accessToken, token, code } = req.body;
    const tokenToUse = credential || token;

    if (!tokenToUse && !accessToken && !code) {
      return next(new AppError('Google credential, access token, or code is required', 400));
    }

    const googleUser = await verifyGoogleCredential(tokenToUse, accessToken, code);

    // 1. Search by googleId
    let user = await User.findOne({ googleId: googleUser.googleId });

    if (!user) {
      // 2. Search by email (link Google ID to existing account)
      user = await User.findOne({ email: googleUser.email.toLowerCase() });

      if (user) {
        user.googleId = googleUser.googleId;
        if (!user.avatar && googleUser.picture) {
          user.avatar = googleUser.picture;
        }
        await user.save();
      } else {
        // 3. Create brand new user
        const username = await generateUniqueUsername(googleUser.name, googleUser.email);
        user = await User.create({
          username,
          email: googleUser.email.toLowerCase(),
          googleId: googleUser.googleId,
          avatar: googleUser.picture || '',
          level: 1,
          xp: 0,
          stats: {
            strength: 50,
            agility: 50,
            endurance: 50
          }
        });
      }
    }

    // Mark online
    await User.findByIdAndUpdate(user._id, {
      isOnline: true,
      lastSeen: new Date()
    });

    const jwtToken = generateToken(user._id.toString());

    res.json({
      status: 'success',
      token: jwtToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        level: user.level,
        xp: user.xp,
        stats: user.stats
      }
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    next(new AppError(error.message || 'Google authentication failed', 401));
  }
});

// @route   GET /api/auth/google
// @desc    Redirect user to Google OAuth consent screen (Alternative redirect flow)
// @access  Public
router.get('/google', (req: Request, res: Response) => {
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    prompt: 'select_account'
  });

  res.redirect(authUrl);
});

// @route   GET /api/auth/google/callback
// @desc    Handle callback from Google OAuth consent screen
// @access  Public
router.get('/google/callback', async (req: Request, res: Response, next: NextFunction) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  try {
    const { code, error } = req.query;

    if (error || !code) {
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(String(error || 'Google login cancelled'))}`);
    }

    const redirectUri = process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(String(code));
    oauth2Client.setCredentials(tokens);

    let googleUser: GoogleProfile;
    if (tokens.id_token) {
      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email || !payload.sub) {
        throw new Error('Invalid Google token');
      }
      googleUser = {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      };
    } else {
      const resUser = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      const info: any = await resUser.json();
      googleUser = {
        googleId: info.sub,
        email: info.email,
        name: info.name,
        picture: info.picture
      };
    }

    let user = await User.findOne({ googleId: googleUser.googleId });
    if (!user) {
      user = await User.findOne({ email: googleUser.email.toLowerCase() });
      if (user) {
        user.googleId = googleUser.googleId;
        if (!user.avatar && googleUser.picture) {
          user.avatar = googleUser.picture;
        }
        await user.save();
      } else {
        const username = await generateUniqueUsername(googleUser.name, googleUser.email);
        user = await User.create({
          username,
          email: googleUser.email.toLowerCase(),
          googleId: googleUser.googleId,
          avatar: googleUser.picture || '',
          level: 1,
          xp: 0,
          stats: {
            strength: 50,
            agility: 50,
            endurance: 50
          }
        });
      }
    }

    await User.findByIdAndUpdate(user._id, {
      isOnline: true,
      lastSeen: new Date()
    });

    const jwtToken = generateToken(user._id.toString());
    res.redirect(`${frontendUrl}/login?token=${jwtToken}&googleSuccess=true`);
  } catch (err: any) {
    console.error('Google callback error:', err);
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(err.message || 'Google sign-in failed')}`);
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (mark offline)
// @access  Private
router.post('/logout', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date()
    });
    res.json({ status: 'success', message: 'Logged out successfully' });
  } catch (error: any) {
    next(error);
  }
});

// @route   GET /api/auth/me
// @desc    Get current user (also refreshes lastSeen / online status)
// @access  Private
router.get('/me', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Refresh online status on each /me call (acts as heartbeat)
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isOnline: true, lastSeen: new Date() },
      { new: true }
    );

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      status: 'success',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        level: user.level,
        xp: user.xp,
        stats: user.stats,
        streak: user.streak,
        goals: user.goals,
        profile: user.profile,
        territories: user.territories,
        challengesWon: user.challengesWon,
        winStreak: user.winStreak
      }
    });
  } catch (error: any) {
    next(error);
  }
});

export { router as authRoutes };
