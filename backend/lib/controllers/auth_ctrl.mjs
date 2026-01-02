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
 * @description Register a new user.
 * @param {String} req
 * @param {String} res
 * @returns
 */
export const register = async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Validate input
    if (!username || !email || !password) {
      console.error(
        "auth_ctrl: 400 Missing required fields for registration:",
        req.body
      );
      return res.status(400).json({ error: "Missing required fields" });
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
 * @description Login an existing user.
 * @param {Headers} req
 * @param {Headers} res
 * @returns
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

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
      maxAge: 7 * 24 * 60 * 60 * 1000,
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
 * @description Logout user by clearing refresh token cookie.
 * @param {Headers} req
 * @param {Headers} res
 */
export const logout = async (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("auth_ctrl: 500 Logout error:", err);
    res.status(500).json({ error: "Logout failed", details: err.message });
  }
};

/**
 * @description Refresh access token using refresh token from cookie.
 * @param {Headers} req
 * @param {Headers} res
 * @returns
 */
export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

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
 * @description Get current user profile.
 * @param {Headers} req
 * @param {Headers} res
 * @returns
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
 * @description Update current user profile.
 * @param {Headers} req
 * @param {Headers} res
 * @returns
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
