import { access } from "fs";

const BACKEND_URL = "http://localhost:3000/api";

const testRegister = async (username, email, password, displayName) => {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        email: email,
        password: password,
        displayName: displayName,
      }),
    });
    const data = await response.json();
    console.log("Register response:", data);
  } catch (error) {
    console.error("Register error:", error);
  }
};
/* testRegister("johndoe", "johndoe@example.com", "password123", "John Doe"); */

let storedAccessToken = null;
const testLogin = async (email, password) => {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email, password: password }),
    });
    const data = await response.json();
    console.log("Login response:", data);

    storedAccessToken = data.accessToken; // Store access token for later use

    return data;
  } catch (error) {
    console.error("Login error:", error);
  }
};
/* testLogin("john@example.com", "password123"); */

// GET /auth/me
const testGetMe = async (accessToken) => {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    });
    const data = await response.json();
    console.log("testGetMe: response:", data);
  } catch (error) {
    console.error("testGetMe: error:", error);
  }
};
// Call Login to retrieve access token then access protected route (getMe)
/* testLogin("john@example.com", "password123").then((result) => {
    console.log("Login successful, received:", result);
    testGetMe(result.accessToken);  // ✓ Pass only the accessToken
}); */

// Test Logout POST Backend /auth/logout (auth_routes.mjs) > logout (auth_ctrl.mjs)
const testLogout = async (accessToken) => {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    });
    const data = await response.json();
    console.log("Logout response:", data);
  } catch (error) {
    console.error("Logout error:", error);
  }
};
testLogin("john@example.com", "password123").then(() => testLogout(storedAccessToken));
