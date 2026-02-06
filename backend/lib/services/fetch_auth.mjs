// Import external modules
import jwt from "jsonwebtoken";

// TODO: remove URL hardcoding once deployed
const AUTH_SERVER_URL =
  process.env.AUTH_SERVER_URL || "http://localhost:4000/auth";

/**
 * @title Request Access Token
 * @description Requests a new access token from the auth server for a given user.
 * @param {String} userID - MongoDB user ID
 * @param {String} username - Username of the user
 * @param {String} email - Email of the user
 * @throws Error if the auth server request fails
 * @returns {Object} Token data object containing the accessToken
 */
export const requestAccessToken = async (userID, username, email) => {
  try {
    const response = await fetch(`${AUTH_SERVER_URL}/token/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userID, username, email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error);
    }

    return data;
  } catch (err) {
    throw new Error(
      `fetch_auth: Error requesting access token: ${err.message}`
    );
  }
};

/**
 * @title Request Refresh Token
 * @description Requests a new refresh token from the auth server for a given user.
 * @param {String} userID - MongoDB user ID
 * @throws Error if the auth server request fails
 * @returns {Object} Token data object containing the refreshToken
 */
export const requestRefreshToken = async (userID) => {
  try {
    const response = await fetch(`${AUTH_SERVER_URL}/token/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userID }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to generate refresh token: ${data.error}`);
    }

    return data;
  } catch (err) {
    throw new Error(`fetch_auth: Error requesting refresh token: ${err}`);
  }
};

/**
 * @title Verify Access Token
 * @description Verifies an access token by sending it to the auth server for validation.
 * @param {String} token - JWT access token to verify
 * @throws Error if the auth server rejects the token or request fails
 * @returns {Object} Decoded token data (userID, username, email)
 */
export const verifyAccessToken = async (token) => {
  try {
    const response = await fetch(`${AUTH_SERVER_URL}/token/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to verify access token: ${data.error}`);
    }

    return data;
  } catch (err) {
    throw new Error(`fetch_auth: Error verifying access token: ${err}`);
  }
};

/**
 * @title Refresh Access Token
 * @description Refreshes an expired access token using a valid refresh token via the auth server.
 * @param {String} refreshToken - Valid refresh token
 * @param {String} username - Username of the user
 * @param {String} email - Email of the user
 * @throws Error if the auth server request fails or refresh token is invalid
 * @returns {Object} Token data object containing the new accessToken
 */
export const refreshAccessToken = async (refreshToken, username, email) => {
  try {
    const response = await fetch(`${AUTH_SERVER_URL}/token/refresh-access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken, username, email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to refresch access token: ${data.error}`);
    }

    return data;
  } catch (err) {
    throw new Error(`fetch_auth: Error refreshing access token: ${err}`);
  }
};

/**
 * @title Verify Token Middleware
 * @description Express middleware that verifies the JWT access token from the Authorization header and attaches user data to the request.
 * @param {Object} req - Express request object (expects Authorization: Bearer <token> header)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @throws 401 if no token provided or token is invalid/expired
 * @returns Calls next() with req.userId, req.username, req.email attached
 */
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("fetch_auth: 401 No token provided");
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];  // Extract token after "Bearer "
    
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // Attach user data to request
    req.userId = decoded.userID;  // ✓ This is what getMe expects
    req.username = decoded.username;
    req.email = decoded.email;
    
    next();
  } catch (err) {
    console.error("fetch_auth: 401 Token verification failed:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
/* 
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  console.log("DEV: verifyToken called with header:", authHeader);
  console.log("DEV: verifyToken called with token:", token);

  if (!token) {
    console.error(
      "fetch_auth: 401 No token provided from header:\n",
      req.headers
    );
    return res
      .status(401)
      .json({ error: "Access denied. No token provided.", status: 401 });
  }

  try {
    const data = await verifyAccessToken(token);

    req.userId = data.userID;
    req.user = {
      id: data.userId,
      username: data.username,
      email: data.email,
    };
    next();
  } catch (err) {
    console.error("Error verifying token:", err.message);
    res.status(500).json({ error: "500 Internal server error." });
  }
}; */
