const AUTH_SERVER_URL =
  process.env.AUTH_SERVER_URL || "http://localhost:4000/auth";

/**
 * @description Requests an access token from the auth server.
 * @param {String} userID
 * @param {String} username
 * @param {String} email
 * @returns
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
 * @description Requests a refresh token from the auth server.
 * @param {String} userID
 * @returns
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
 * @description Verifies an access token with the auth server.
 * @param {String} token
 * @returns
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
 * @description Refreshes an access token using a refresh token.
 * @param {String} refreshToken
 * @param {String} username
 * @param {String} email
 * @returns
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
 * @description Middleware to verify JWT token with auth server.
 * @param {String} req
 * @param {String} res
 * @param {String} next
 * @returns
 */
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

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
};
