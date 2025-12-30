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
router.post('/generateAccessToken', generateAccessToken);
router.post('/generateRefreshToken', generateRefreshToken);

// Token verification (called by backend to verify tokens)
router.post('/verifyAccessToken', verifyAccessToken);
router.post('/verifyRefreshToken', verifyRefreshToken);

// Token refresh (called by backend to refresh access tokens)
router.post('/refreshAccessToken', refreshAccessToken);

export default router;
