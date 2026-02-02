// Import external libraries
import jwt from "jsonwebtoken";

/**
 * @description Generate an access token for the user.
 * @param {Headers} req userID, username, email in body
 * @param {Response} res
 * @returns
 */
export const generateAccessToken = (req, res) => {
  try {
    const { userID, username, email } = req.body;

    console.log("controllers: generateAccessToken called with:", {
      userID,
      username,
      email,
    });

    if (!userID) {
      console.error();
      return res.status(404).json({ error: "userID is required" });
    }

    const accessToken = jwt.sign(
      { userID, username, email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    console.log("controllers: Generated access token for Username:", username);
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
    const { userID } = req.body;

    console.log("controllers: Generated refresh token called with:", {
      userID,
    });

    if (!userID) {
      console.error(`controllers: 404 userID is required for token refresh`);
      return res.status(404).json({ error: "userID is required" });
    }

    const refreshToken = jwt.sign(
      { userID },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    console.log("controllers: Refresh token successfully generated.");
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
    // Extract token from Authorization header OR body
    const authHeader = req.headers.authorization;
    let accessToken = req.body.accessToken;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.split(" ")[1];
    }

    if (!accessToken) {
      console.error("controllers: 404 No access token provided");
      return res
        .status(404)
        .json({ valid: false, error: "No access token provided" });
    }

    console.log("controllers: DEV verifyAccessToken:", {
      accessToken,
    });
    console.log(
      "controllers: DEV Using secret:",
      process.env.ACCESS_TOKEN_SECRET
    );

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    res.json({
      valid: true,
      userId: decoded.userId,
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      console.error("controllers: 401 Access token expired:\n", err);
      return res
        .status(401)
        .json({ valid: false, error: "Access token expired" });
    }
    console.error("controllers: 401 Invalid access token:\n", err);
    res.status(401).json({ valid: false, error: "Invalid access token" });
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
    // Extract token from Authorization header OR body
    const authHeader = req.headers.authorization;
    let refreshToken = req.body.refreshToken;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      refreshToken = authHeader.split(" ")[1];
    }

    console.log("controllers: verifyRefreshToken:", {
      refreshToken,
    });

    if (!refreshToken) {
      return res
        .status(401)
        .json({ valid: false, error: "No refresh token provided" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

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

    console.log("DEV: refreshAccessToken called with:", {
      refreshToken,
      username,
      email,
    });

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, username, email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    console.log("controllers: New access token generated via refresh token:", {
      newAccessToken,
    });

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
