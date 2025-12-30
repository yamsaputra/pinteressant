// Import external libraries
import jwt from "jsonwebtoken";

/**
 * @description Generate an access token for the user.
 * @param {Headers} req 
 * @param {Response} res 
 * @returns 
 */
export const generateAccessToken = (req, res) => {
  try {
    const { userId, username, email } = req.body;

    if (!userId) {
      console.error();
      return res.status(404).json({ error: "userId is required" });
    }

    const accessToken = jwt.sign(
      { userId, username, email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken, expiresIn: 900 }); // 900 seconds = 15 minutes
  } catch (err) {
    console.error("controllers: 500 Error generating access token:", err);
    res.status(500).json({ error: "Failed to generate access token" });
  }
};

/**
 * @description Generate a refresh token for the user.
 * @param {Headers} req 
 * @param {Response} res 
 * @returns 
 */
export const generateRefreshToken = (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      console.error(`controllers: 404 userId is required for token refresh`);
      return res.status(404).json({ error: "userId is required" });
    }

    const refreshToken = jwt.sign(
      { userId },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ refreshToken, expiresIn: 604800 }); // 604800 seconds = 7 days
  } catch (err) {
    console.error("controllers: 500 Error generating refresh token:", err);
    res.status(500).json({ error: "Failed to generate refresh token" });
  }
};

/**
 * @description
 * @param {Headers} req
 * @param {Response} res
 */
export const verifyAccessToken = (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      console.error("controllers: 404 No refresh token provided");
      return res
        .status(404)
        .json({ valid: false, error: "No refresh token provided" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    res.json({
      valid: true,
      userId: decoded.userId,
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      console.error("controllers: 401 Refresh token expired:\n", err);
      return res
        .status(401)
        .json({ valid: false, error: "Refresh token expired" });
    }
    console.error("controllers: 401 Invalid refresh token:\n", err);
    res.status(401).json({ valid: false, error: "Invalid refresh token" });
  }
};

// TODO: why does it not require return statement
/**
 * @description Verify refresh token validity.
 * @param {Headers} req
 * @param {Response} res
 * @returns
 */
export const verifyRefreshToken = (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(401)
        .json({ valid: false, error: "No refresh token provided" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    res.json({
      valid: true,
      userId: decoded.userId,
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ valid: false, error: "Refresh token expired" });
    }
    res.status(401).json({ valid: false, error: "Invalid refresh token" });
  }
};

/**
 * @description Refresh access token using a valid refresh token.
 * @param {Headers} req
 * @param {Response} res
 * @returns
 */
export const refreshAccessToken = (req, res) => {
  try {
    const { refreshToken, username, email } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, username, email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({
      accessToken: newAccessToken,
      expiresIn: 900,
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Refresh token expired" });
    }
    res.status(401).json({ error: "Invalid refresh token" });
  }
};
