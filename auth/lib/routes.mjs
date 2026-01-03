// Import external libraries
import express from 'express';

// Import local modules
import {
    generateAccessToken,
    generateRefreshToken,  
    verifyAccessToken,
    verifyRefreshToken,
    refreshAccessToken,
} from './controllers.mjs';

const router = express.Router();

// Token generation (called by backend after user validation)
router.post('/token/access', generateAccessToken);
router.post('/token/refresh', generateRefreshToken);

// Token verification (called by backend to verify tokens)
router.post('/token/verify', verifyAccessToken);
router.post('/token/verify-refresh', verifyRefreshToken);

// Token refresh (called by backend to refresh access tokens)
router.post('/token/refresh-access', refreshAccessToken);

export default router;
