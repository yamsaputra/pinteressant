const BACKEND_URL = "http://localhost:3000";
const AUTH_URL = "http://localhost:4000";

// Test user data
const testUser = {
  username: "johndoe",
  email: "john@example.com",
  password: "password123",
  displayName: "John Doe",
};

// Store tokens for testing
let accessToken = null;
let refreshToken = null;
let userId = null;

// Helper function to log responses
const logResponse = (testName, data, status) => {
  console.log("\n" + "=".repeat(50));
  console.log("TEST: " + testName);
  console.log("=".repeat(50));
  console.log("Status: " + status);
  console.log("Response:", JSON.stringify(data, null, 2));
};

// Get access token directly from auth server
const getAccessTokenFromAuth = async (userIdParam, username, email) => {
  try {
    console.log("getAccessTokenFromAuth:\n" + "-".repeat(50));
    console.log("Fetching access token from Auth Server...");
    console.log("-".repeat(50));

    const response = await fetch(`${AUTH_URL}/auth/token/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userIdParam,
        username: username,
        email: email,
      }),
    });

    const data = await response.json();

    if (response.ok && data.accessToken) {
      console.log("Access token retrieved successfully");
      console.log("Token expires in: " + data.expiresIn + " seconds");
      return data.accessToken;
    } else {
      console.log("Failed to get access token: " + (data.error || "Unknown error"));
      return null;
    }
  } catch (err) {
    console.error("getAccessTokenFromAuth: Server error: " + err.message);
    return null;
  }
};

// Get refresh token directly from auth server
const getRefreshTokenFromAuth = async (userIdParam) => {
  try {
    console.log("\n" + "-".repeat(50));
    console.log("Fetching refresh token from Auth Server...");
    console.log("-".repeat(50));

    const response = await fetch(`${AUTH_URL}/auth/token/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userIdParam,
      }),
    });

    const data = await response.json();

    if (response.ok && data.refreshToken) {
      console.log("Refresh token retrieved successfully");
      console.log("Token expires in: " + data.expiresIn + " seconds");
      return data.refreshToken;
    } else {
      console.log("Failed to get refresh token: " + (data.error || "Unknown error"));
      return null;
    }
  } catch (err) {
    console.error("Auth server error: " + err.message);
    return null;
  }
};

// Verify token with auth server
const verifyTokenWithAuth = async (token) => {
  try {
    console.log("\n" + "-".repeat(50));
    console.log("Verifying token with Auth Server...");
    console.log("-".repeat(50));

    const response = await fetch(`${AUTH_URL}/auth/token/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    });

    const data = await response.json();

    if (response.ok && data.valid) {
      console.log("Token is valid");
      console.log("User ID: " + data.userId);
      console.log("Username: " + data.username);
      return data;
    } else {
      console.log("Token is invalid: " + (data.error || "Unknown error"));
      return null;
    }
  } catch (err) {
    console.error("Auth server error: " + err.message);
    return null;
  }
};

// Test Registration
const testRegister = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });

    const data = await response.json();
    logResponse("REGISTER", data, response.status);

    if (data.accessToken) {
      accessToken = data.accessToken;
      userId = data.user.id;
      console.log("\n[SUCCESS] Registration successful!");
    } else {
      console.log("\n[FAILED] Registration failed!");
    }

    return data;
  } catch (err) {
    console.error("Register error: " + err.message);
  }
};

// Test Login
const testLogin = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const data = await response.json();
    logResponse("LOGIN", data, response.status);

    if (data.accessToken) {
      accessToken = data.accessToken;
      userId = data.user.id;
      console.log("\n[SUCCESS] Login successful!");
    } else {
      console.log("\n[FAILED] Login failed!");
    }

    return data;
  } catch (err) {
    console.error("Login error: " + err.message);
  }
};

// Test Get Me (Protected Route)
const testGetMe = async () => {
  if (!accessToken) {
    console.log("\n[FAILED] No access token. Login first.");
    return;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    });

    const data = await response.json();
    logResponse("GET ME", data, response.status);

    if (response.ok) {
      console.log("\n[SUCCESS] Get me successful!");
    } else {
      console.log("\n[FAILED] Get me failed!");
    }

    return data;
  } catch (err) {
    console.error("Get me error: " + err.message);
  }
};

// Test Logout
const testLogout = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    logResponse("LOGOUT", data, response.status);

    if (response.ok) {
      accessToken = null;
      console.log("\n[SUCCESS] Logout successful!");
    } else {
      console.log("\n[FAILED] Logout failed!");
    }

    return data;
  } catch (err) {
    console.error("Logout error: " + err.message);
  }
};

// Test Login with Wrong Password
const testLoginWrongPassword = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: "wrongpassword",
      }),
    });

    const data = await response.json();
    logResponse("LOGIN (Wrong Password)", data, response.status);

    if (response.status === 401) {
      console.log("\n[SUCCESS] Correctly rejected wrong password!");
    } else {
      console.log("\n[FAILED] Should have rejected wrong password!");
    }

    return data;
  } catch (err) {
    console.error("Login error: " + err.message);
  }
};

// Test Duplicate Registration
const testDuplicateRegister = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });

    const data = await response.json();
    logResponse("REGISTER (Duplicate)", data, response.status);

    if (response.status === 400) {
      console.log("\n[SUCCESS] Correctly rejected duplicate user!");
    } else {
      console.log("\n[FAILED] Should have rejected duplicate user!");
    }

    return data;
  } catch (err) {
    console.error("Register error: " + err.message);
  }
};

// Test getting token directly from auth server and using it
const testDirectAuthToken = async () => {
  console.log("\n" + "=".repeat(50));
  console.log("TEST: DIRECT AUTH SERVER TOKEN");
  console.log("=".repeat(50));

  if (!userId) {
    console.log("[FAILED] No user ID. Register or login first.");
    return;
  }

  // Get access token directly from auth server
  const token = await getAccessTokenFromAuth(userId, testUser.username, testUser.email);

  if (!token) {
    console.log("\n[FAILED] Could not get token from auth server!");
    return;
  }

  // Verify the token
  const verifyResult = await verifyTokenWithAuth(token);

  if (!verifyResult) {
    console.log("\n[FAILED] Token verification failed!");
    return;
  }

  // Use the token to make a request to backend
  console.log("\n" + "-".repeat(50));
  console.log("Using auth token to call Backend /api/auth/me...");
  console.log("-".repeat(50));

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Backend request successful!");
      console.log("User data:", JSON.stringify(data, null, 2));
      console.log("\n[SUCCESS] Direct auth token flow works!");
    } else {
      console.log("Backend request failed: " + (data.error || "Unknown error"));
      console.log("\n[FAILED] Direct auth token flow failed!");
    }
  } catch (err) {
    console.error("Backend request error: " + err.message);
  }
};

// Test refresh token flow
const testRefreshTokenFlow = async () => {
  console.log("\n" + "=".repeat(50));
  console.log("TEST: REFRESH TOKEN FLOW");
  console.log("=".repeat(50));

  if (!userId) {
    console.log("[FAILED] No user ID. Register or login first.");
    return;
  }

  // Get refresh token from auth server
  refreshToken = await getRefreshTokenFromAuth(userId);

  if (!refreshToken) {
    console.log("\n[FAILED] Could not get refresh token!");
    return;
  }

  // Use refresh token to get new access token
  console.log("\n" + "-".repeat(50));
  console.log("Using refresh token to get new access token...");
  console.log("-".repeat(50));

  try {
    const response = await fetch(`${AUTH_URL}/auth/token/refresh-access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refreshToken: refreshToken,
        username: testUser.username,
        email: testUser.email,
      }),
    });

    const data = await response.json();

    if (response.ok && data.accessToken) {
      console.log("New access token received!");
      accessToken = data.accessToken;

      // Verify new token works
      const meResponse = await fetch(`${BACKEND_URL}/api/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + accessToken,
        },
      });

      const meData = await meResponse.json();

      if (meResponse.ok) {
        console.log("New token works with backend!");
        console.log("\n[SUCCESS] Refresh token flow works!");
      } else {
        console.log("New token rejected by backend: " + (meData.error || "Unknown error"));
        console.log("\n[FAILED] Refresh token flow failed!");
      }
    } else {
      console.log("Failed to refresh access token: " + (data.error || "Unknown error"));
      console.log("\n[FAILED] Refresh token flow failed!");
    }
  } catch (err) {
    console.error("Refresh token error: " + err.message);
  }
};

// Run all tests
const runTests = async () => {
  console.log("\n");
  console.log("=".repeat(50));
  console.log("STARTING AUTH TESTS");
  console.log("=".repeat(50));

  // Test 1: Register new user
  await testRegister();

  // Test 2: Try duplicate registration
  await testDuplicateRegister();

  // Test 3: Login
  await testLogin();

  // Test 4: Get me (protected)
  await testGetMe();

  // Test 5: Wrong password
  await testLoginWrongPassword();

  // Test 6: Direct auth server token
  await testDirectAuthToken();

  // Test 7: Refresh token flow
  await testRefreshTokenFlow();

  // Test 8: Logout
  await testLogout();

  // Test 9: Login again after logout
  await testLogin();

  console.log("\n" + "=".repeat(50));
  console.log("ALL TESTS COMPLETED");
  console.log("=".repeat(50));
  console.log("\n");
};

// Run tests
runTests();