const BACKEND_URL = "http://localhost:3000";
const AUTH_URL = "http://localhost:4000/auth";

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

// Helper function to safely parse JSON response
const safeParseJSON = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse JSON. Raw response:");
    console.error(text.substring(0, 500));
    throw new Error("Invalid JSON response - server may be down or returning HTML error page");
  }
};

// Test Registration (via Backend)
const testRegister = async () => {
  try {
    console.log("\n" + "=".repeat(50));
    console.log("TEST: REGISTER");
    console.log("=".repeat(50));

    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });

    const data = await safeParseJSON(response);
    console.log("Status: " + response.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.ok && data.accessToken) {
      accessToken = data.accessToken;
      userId = data.user.id;
      console.log("\n[SUCCESS] Registration successful!");
    } else {
      console.log("\n[FAILED] Registration failed: " + (data.error || "Unknown error"));
    }

    return data;
  } catch (err) {
    console.error("[ERROR] Register error: " + err.message);
    return null;
  }
};

// Test Login (via Backend)
const testLogin = async () => {
  try {
    console.log("\n" + "=".repeat(50));
    console.log("TEST: LOGIN");
    console.log("=".repeat(50));

    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const data = await safeParseJSON(response);
    console.log("Status: " + response.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.ok && data.accessToken) {
      accessToken = data.accessToken;
      userId = data.user.id;
      console.log("\n[SUCCESS] Login successful!");
    } else {
      console.log("\n[FAILED] Login failed: " + (data.error || "Unknown error"));
    }

    return data;
  } catch (err) {
    console.error("[ERROR] Login error: " + err.message);
    return null;
  }
};

// Test Get Me (Protected Route via Backend)
const testGetMe = async () => {
  console.log("\n" + "=".repeat(50));
  console.log("TEST: GET ME");
  console.log("=".repeat(50));

  if (!accessToken) {
    console.log("[FAILED] No access token. Login first.");
    return null;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    });

    const data = await safeParseJSON(response);
    console.log("Status: " + response.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("\n[SUCCESS] Get me successful!");
    } else {
      console.log("\n[FAILED] Get me failed: " + (data.error || "Unknown error"));
    }

    return data;
  } catch (err) {
    console.error("[ERROR] Get me error: " + err.message);
    return null;
  }
};

// Test Logout (via Backend)
const testLogout = async () => {
  try {
    console.log("\n" + "=".repeat(50));
    console.log("TEST: LOGOUT");
    console.log("=".repeat(50));

    const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await safeParseJSON(response);
    console.log("Status: " + response.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.ok) {
      accessToken = null;
      console.log("\n[SUCCESS] Logout successful!");
    } else {
      console.log("\n[FAILED] Logout failed: " + (data.error || "Unknown error"));
    }

    return data;
  } catch (err) {
    console.error("[ERROR] Logout error: " + err.message);
    return null;
  }
};

// Test Login with Wrong Password
const testLoginWrongPassword = async () => {
  try {
    console.log("\n" + "=".repeat(50));
    console.log("TEST: LOGIN (Wrong Password)");
    console.log("=".repeat(50));

    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: "wrongpassword",
      }),
    });

    const data = await safeParseJSON(response);
    console.log("Status: " + response.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.status === 401) {
      console.log("\n[SUCCESS] Correctly rejected wrong password!");
    } else {
      console.log("\n[FAILED] Should have rejected wrong password!");
    }

    return data;
  } catch (err) {
    console.error("[ERROR] Login error: " + err.message);
    return null;
  }
};

// Test Duplicate Registration
const testDuplicateRegister = async () => {
  try {
    console.log("\n" + "=".repeat(50));
    console.log("TEST: REGISTER (Duplicate)");
    console.log("=".repeat(50));

    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });

    const data = await safeParseJSON(response);
    console.log("Status: " + response.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.status === 400) {
      console.log("\n[SUCCESS] Correctly rejected duplicate user!");
    } else {
      console.log("\n[FAILED] Should have rejected duplicate user!");
    }

    return data;
  } catch (err) {
    console.error("[ERROR] Register error: " + err.message);
    return null;
  }
};

// Test Update Profile (Protected Route)
const testUpdateProfile = async () => {
  console.log("\n" + "=".repeat(50));
  console.log("TEST: UPDATE PROFILE");
  console.log("=".repeat(50));

  if (!accessToken) {
    console.log("[FAILED] No access token. Login first.");
    return null;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
      body: JSON.stringify({
        displayName: "John Updated",
        tagline: "Photography enthusiast",
      }),
    });

    const data = await safeParseJSON(response);
    console.log("Status: " + response.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("\n[SUCCESS] Profile updated successfully!");
    } else {
      console.log("\n[FAILED] Profile update failed: " + (data.error || "Unknown error"));
    }

    return data;
  } catch (err) {
    console.error("[ERROR] Update profile error: " + err.message);
    return null;
  }
};

// Test Missing Fields Registration
const testMissingFieldsRegister = async () => {
  try {
    console.log("\n" + "=".repeat(50));
    console.log("TEST: REGISTER (Missing Fields)");
    console.log("=".repeat(50));

    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "testuser",
        // missing email and password
      }),
    });

    const data = await safeParseJSON(response);
    console.log("Status: " + response.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.status === 400) {
      console.log("\n[SUCCESS] Correctly rejected missing fields!");
    } else {
      console.log("\n[FAILED] Should have rejected missing fields!");
    }

    return data;
  } catch (err) {
    console.error("[ERROR] Register error: " + err.message);
    return null;
  }
};

// Test Access Protected Route Without Token
const testProtectedRouteNoToken = async () => {
  try {
    console.log("\n" + "=".repeat(50));
    console.log("TEST: GET ME (No Token)");
    console.log("=".repeat(50));

    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // No Authorization header
      },
    });

    const data = await safeParseJSON(response);
    console.log("Status: " + response.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.status === 401) {
      console.log("\n[SUCCESS] Correctly rejected request without token!");
    } else {
      console.log("\n[FAILED] Should have rejected request without token!");
    }

    return data;
  } catch (err) {
    console.error("[ERROR] Get me error: " + err.message);
    return null;
  }
};

// Test Access Protected Route With Invalid Token
const testProtectedRouteInvalidToken = async () => {
  try {
    console.log("\n" + "=".repeat(50));
    console.log("TEST: GET ME (Invalid Token)");
    console.log("=".repeat(50));

    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid.token.here",
      },
    });

    const data = await safeParseJSON(response);
    console.log("Status: " + response.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.status === 401) {
      console.log("\n[SUCCESS] Correctly rejected invalid token!");
    } else {
      console.log("\n[FAILED] Should have rejected invalid token!");
    }

    return data;
  } catch (err) {
    console.error("[ERROR] Get me error: " + err.message);
    return null;
  }
};

// Check if servers are running
const checkServers = async () => {
  console.log("\n" + "=".repeat(50));
  console.log("CHECKING SERVERS");
  console.log("=".repeat(50));

  let backendOk = false;
  let authOk = false;

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/test`);
    const backendText = await backendResponse.text();
    console.log("Backend server (" + BACKEND_URL + "): " + (backendResponse.ok ? "OK" : "ERROR"));
    backendOk = backendResponse.ok;
  } catch (err) {
    console.log("Backend server (" + BACKEND_URL + "): NOT RUNNING - " + err.message);
  }

  try {
    const authResponse = await fetch(`${AUTH_URL}/test`);
    const authText = await authResponse.text();
    console.log("Auth server (" + AUTH_URL + "): " + (authResponse.ok ? "OK" : "ERROR"));
    authOk = authResponse.ok;
  } catch (err) {
    console.log("Auth server (" + AUTH_URL + "): NOT RUNNING - " + err.message);
  }

  if (!backendOk || !authOk) {
    console.log("\n[ERROR] One or more servers are not running!");
    console.log("Please start both servers before running tests:");
    console.log("  Terminal 1: cd auth && node auth_main.mjs");
    console.log("  Terminal 2: cd backend && node main.mjs");
    return false;
  }

  console.log("\n[OK] Both servers are running!");
  return true;
};

// Run all tests
const runTests = async () => {
  console.log("\n");
  console.log("=".repeat(50));
  console.log("STARTING AUTH TESTS");
  console.log("=".repeat(50));

  // Check if servers are running
  const serversOk = await checkServers();
  if (!serversOk) {
    return;
  }

  // Test 1: Missing fields registration
  await testMissingFieldsRegister();

  // Test 2: Register new user
  await testRegister();

  // Test 3: Try duplicate registration
  await testDuplicateRegister();

  // Test 4: Login
  await testLogin();

  // Test 5: Get me (protected)
  await testGetMe();

  // Test 6: Update profile
  await testUpdateProfile();

  // Test 7: Wrong password
  await testLoginWrongPassword();

  // Test 8: Protected route without token
  await testProtectedRouteNoToken();

  // Test 9: Protected route with invalid token
  await testProtectedRouteInvalidToken();

  // Test 10: Logout
  await testLogout();

  // Test 11: Login again after logout
  await testLogin();

  // Test 12: Get me after re-login
  await testGetMe();

  console.log("\n" + "=".repeat(50));
  console.log("ALL TESTS COMPLETED");
  console.log("=".repeat(50));
  console.log("\n");
};

// Run tests
runTests();