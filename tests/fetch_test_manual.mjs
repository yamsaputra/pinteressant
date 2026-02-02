const AUTH_URL = "http://localhost:4000/auth";

const getTestAuth = async () => {
  try {
    const response = await fetch(`${AUTH_URL}/test`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.text();
    console.log("Test Auth response:", data);
  }
  catch (error) {
    console.error("Error fetching test auth:", error);
  }
};
/* getTestAuth(); */

// Generate access token
const getAccessTokenFromAuth = async (userID, username, email) => {
  try {
    const response = await fetch(`${AUTH_URL}/token/access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userID: userID, username: username, email: email}),
    });

    const data = await response.json();
    console.log("Access Token response:", data);
    return data.accessToken;
  } catch (error) {
    console.error("Error fetching access token:", error);
  }
};
/* getAccessTokenFromAuth("6957b8f8a5853d85cb6eaca2", "johndoe", "johndoe@example.com");
 */
// Generate refresh token
const getRefreshTokenFromAuth = async (userID) => {
  try {
    const response = await fetch(`${AUTH_URL}/token/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userID: userID }),
    });
    const data = await response.json();
    console.log("Refresh Token response:", data);
    return data.refreshToken;
  } catch (error) {
    console.error("Error fetching refresh token:", error);
  }
};
/* getRefreshTokenFromAuth("6957b8f8a5853d85cb6eaca2"); */

// Verify access token
const verifyAccessToken = async (token) => {
  try {

    console.log("Verifying access token:", token);

    const response = await fetch(`${AUTH_URL}/token/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    console.log("Verify Access Token response:", data);
    return data;
  } catch (error) {
    console.error("Error verifying access token:", error);
  }
};
/* verifyAccessToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI2OTU3YjhmOGE1ODUzZDg1Y2I2ZWFjYTIiLCJ1c2VybmFtZSI6ImpvaG5kb2UiLCJlbWFpbCI6ImpvaG5kb2VAZXhhbXBsZS5jb20iLCJpYXQiOjE3NjgxNTA0ODEsImV4cCI6MTc2ODE1MTM4MX0.m0Tkia1uyN633pQEjFa9xFxEPBPdvYNtRq6UcNHCwYM");
 */

// Verify refresh token
const verifyRefreshToken = async (token) => {
  try {
    console.log("Verifying refresh token:", token);
    const response = await fetch(`${AUTH_URL}/token/verify-refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    console.log("Verify Refresh Token response:", data);
    return data;
  } catch (error) {
    console.error("Error verifying refresh token:", error);
  }
};
/* verifyRefreshToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI2OTU3YjhmOGE1ODUzZDg1Y2I2ZWFjYTIiLCJpYXQiOjE3NjgxNTA2NTEsImV4cCI6MTc2ODc1NTQ1MX0.FvIPTXKCE8DEZhfekR9KXRh--CU-tJOIohNrVcI0C4s")
 */

// Refresh access token
const refreshAccessToken = async (refreshToken, username, email) => {
  try {
    const response = await fetch(`${AUTH_URL}/token/refresh-access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken, username, email }),
    });
    const data = await response.json();
    console.log("Refresh Access Token response:", data);
    return data.accessToken;
  } catch (error) {
    console.error("Error refreshing access token:", error);
  }
};
/* refreshAccessToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI2OTU3YjhmOGE1ODUzZDg1Y2I2ZWFjYTIiLCJpYXQiOjE3NjgxNTA2NTEsImV4cCI6MTc2ODc1NTQ1MX0.FvIPTXKCE8DEZhfekR9KXRh--CU-tJOIohNrVcI0C4s", "johndoe", "johndoe@example.com");
 */

// Generate refresh token

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
/* testRegister("johndoe", "johndoe@example.com", "password123", "John Doe");
 */


// Test Login POST Backend /auth/login (auth_routes.mjs) > login (auth_ctrl.mjs)
let storedAccessToken = null;
const testLogin = async (email, password) => {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",  // ✓ Receive and store cookies
      body: JSON.stringify({ email: email, password: password }),
    });
    const data = await response.json();
    console.log("Login response:", data);

    storedAccessToken = data.accessToken;

    return data;
  } catch (error) {
    console.error("Login error:", error);
  }
};
/* testLogin("john@example.com", "password123");
 */
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
/* testLogin("john@example.com", "password123").then(() => testLogout(storedAccessToken));
 */


