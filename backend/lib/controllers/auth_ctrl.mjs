// Import external libaries
import bcrypt from "bcryptjs";

// Import local modules and DB models
import { User } from "../db/models/model_index.mjs";
import {
  requestAccessToken,
  requestRefreshToken,
  refreshAccessToken,
} from "../services/fetch_auth.mjs";

/**
 * @title Register User
 * @description Registers a new user account, hashes the password, requests auth tokens, and sets a refresh token cookie.
 * @route POST /api/auth/register
 * @access Public
 * @param {String} req.body.username - Unique username (required)
 * @param {String} req.body.email - Unique email address (required)
 * @param {String} req.body.password - Password to hash and store (required)
 * @param {String} req.body.displayName - Display name for the user profile (required)
 * @param {*} res - status 201 with access token and user data if successful
 * @throws 400 if required fields missing or username/email already in use, 500 if registration fails
 * @returns 201 with accessToken and user object (id, username, email, displayName)
 */
export const register = async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Validate input
    if (!username) {
      console.error(
        "auth_ctrl: 400 Username missing / invalid from registration:",
        req.body
      );
      return res.status(400).json({ error: "Missing required fields" });
    } else if (!email) {
      console.error(
        "auth_ctrl: 400 Email missing / invalid from registration:",
        email
      );
      return res.status(400).json({ error: "Invalid email format" });
    } else if (!password) {
      console.error(
        "auth_ctrl: 400 Password missing / invalid from registration",
        password
      );
      return res.status(400).json({ error: "Invalid password format" });
    } else if (!displayName) {
      console.error(
        "auth_ctrl: 400 Display name missing / invalid from registration",
        displayName
      );
      return res.status(400).json({ error: "Invalid display name format" });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() },
      ],
    });

    if (existingUser) {
      console.error(
        `auth_ctrl: 400 Username or email already in use. username: ${username}, email: ${email}`
      );
      return res
        .status(400)
        .json({ error: "Username or email already in use" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in database
    const newUser = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      displayName: displayName || username,
    });

    // Request tokens from auth server
    const accessTokenData = await requestAccessToken(
      newUser._id.toString(),
      newUser.username,
      newUser.email
    );

    const refreshTokenData = await requestRefreshToken(newUser._id.toString());

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshTokenData.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: "User registered successfully",
      accessToken: accessTokenData.accessToken,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.displayName,
      },
    });
  } catch (err) {
    console.error("auth_ctrl: 500 Register error:", err);
    res
      .status(500)
      .json({ error: "Registration failed", details: err.message });
  }
};

/**
 * @title Login User
 * @description Authenticates a user with email and password, issues access and refresh tokens.
 * @route POST /api/auth/login
 * @access Public
 * @param {String} req.body.email - Email address of the user (required)
 * @param {String} req.body.password - Password of the user (required)
 * @param {*} res - status 200 with access token and user data if successful
 * @throws 400 if email or password missing, 401 if credentials invalid, 500 if login fails
 * @returns 200 with accessToken and user object (id, username, email, displayName)
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("auth_ctrl: Login attempt for email:", email);
    console.log("auth_ctrl: Request body:", req.body);

    if (!email || !password) {
      console.error(
        "auth_ctrl: 400 Email and password required, field missing:",
        req.body
      );
      return res.status(400).json({ error: "Email and password required" });
    }

    // Find user in database
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error("auth_ctrl: 401 Invalid credentials for email:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.error("auth_ctrl: 401 Invalid credentials for email:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Request tokens from auth server
    const accessTokenData = await requestAccessToken(
      user._id.toString(),
      user.username,
      user.email
    );

    const refreshTokenData = await requestRefreshToken(user._id.toString());

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshTokenData.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "Login successful",
      accessToken: accessTokenData.accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (err) {
    console.error("auth_ctrl: 500 Login error:", err);
    res.status(500).json({ error: "Login failed", details: err.message });
  }
};

/**
 * @title Logout User
 * @description Logs out the user by clearing the refresh token HTTP-only cookie.
 * @route POST /api/auth/logout
 * @access Private (requires authentication via verifyToken middleware)
 * @param {*} res - status 200 with logout confirmation message
 * @throws 401 if user is not authenticated, 500 if logout fails
 * @returns 200 with success message
 */
export const logout = async (req, res) => {
  try {
    console.log("auth_ctrl: Logout attempt for userId:", req.userId);
    const userId = req.userId; // From verifyToken middleware

    if (!userId) {
      console.error("auth_ctrl: 401 User not authenticated for logout");
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Optional: Add userId to a blacklist/revocation list in Redis/DB
    // This prevents the access token from being used even if copied
    // await addToTokenBlacklist(userId, accessToken);

    console.log(`auth_ctrl: User ${userId} logged out successfully`);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("auth_ctrl: 500 Logout error:", err);
    res.status(500).json({ error: "Logout failed", details: err.message });
  }
};
/* 
export const logout = async (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("auth_ctrl: 500 Logout error:", err);
    res.status(500).json({ error: "Logout failed", details: err.message });
  }
}; */

/**
 * @title Refresh Access Token
 * @description Refreshes the access token using the refresh token stored in an HTTP-only cookie.
 * @route POST /api/auth/refresh
 * @access Public (requires valid refresh token cookie)
 * @param {String} req.cookies.refreshToken - Refresh token from HTTP-only cookie (required)
 * @param {String} [req.body.userId] - Optional user ID (fallback to req.userId from middleware)
 * @param {*} res - status 200 with new access token if successful
 * @throws 401 if no refresh token provided or token is invalid, 404 if user not found
 * @returns 200 with new accessToken
 */
export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    console.log("auth_ctrl: Refresh token request received.", { refreshToken } );

    if (!refreshToken) {
      console.error("auth_ctrl: 401 No refresh token provided");
      return res.status(401).json({ error: "No refresh token provided" });
    }

    // Get user from database to include latest username/email
    const userID = req.body.userId || req.userId;
    const user = await User.findById(userID).select("-password");

    if (!user) {
      console.error("auth_ctrl: 404 User not found for ID:", userID);
      return res.status(404).json({ error: "User not found" });
    }

    // Request new access token from auth server
    const accessTokenData = await refreshAccessToken(
      refreshToken,
      user.username,
      user.email
    );

    res.json({
      accessToken: accessTokenData.accessToken,
    });
  } catch (err) {
    console.error("auth_ctrl: 401 Refresh token error:", err);
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

/**
 * @title Get Current User
 * @description Retrieves the authenticated user's profile data (excluding password).
 * @route GET /api/auth/me
 * @access Private (requires authentication via verifyToken middleware)
 * @param {*} res - status 200 with user profile data
 * @throws 404 if user not found, 500 if fetch fails
 * @returns 200 with user object (all fields except password)
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      console.error("auth_ctrl: 404 User not found for ID:", req.userId);
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("auth_ctrl: 500 Get me error:", err);
    res.status(500).json({ error: "Failed to get user", details: err.message });
  }
};

/**
 * @title Update User Profile
 * @description Updates the authenticated user's profile. Prevents changes to sensitive fields (password, email, username).
 * @route PUT /api/auth/profile
 * @access Private (requires authentication via verifyToken middleware)
 * @param {JSON} req.body - Fields to update (e.g. { displayName: "New Name", bio: "About me" })
 * @param {*} res - status 200 with updated user data if successful
 * @throws 404 if user not found, 500 if update fails
 * @returns 200 with updated user object (excluding password)
 */
export const updateProfile = async (req, res) => {
  try {
    const userID = req.userId;
    const updates = req.body;

    // Prevent updating sensitive fields
    delete updates.password;
    delete updates.email;
    delete updates.username;

    const updatedUser = await User.findByIdAndUpdate(userID, updates, {
      new: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Profile updated", user: updatedUser });
  } catch (err) {
    console.error("auth_ctrl: 500 Update profile error:", err);
    res
      .status(500)
      .json({ error: "Failed to update profile", details: err.message });
  }
};
