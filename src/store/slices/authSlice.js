import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  return import.meta.env.PROD ? "/api" : "http://localhost:5000/api";
};

const API_URL = getApiUrl();

const getApiErrorMessage = (error, fallbackMessage) => {
  const details = error?.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) {
    return details[0].msg || fallbackMessage;
  }

  return error?.response?.data?.error || fallbackMessage;
};

const getTokenFromStorage = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    return JSON.parse(token);
  } catch {
    return token;
  }
};

const setTokenInStorage = (token) => {
  localStorage.setItem("accessToken", JSON.stringify(token));
};

const removeTokensFromStorage = () => {
  localStorage.removeItem("accessToken");
};

const initialState = {
  user: null,
  accessToken: getTokenFromStorage(),
  refreshToken: null,
  twoFactorChallengeToken: null,
  twoFactorEmail: "",
  hasCheckedAuth: false,
  isLoading: false,
  error: null,
};

export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      return {
        message: response.data.message,
        email: response.data.data?.email,
      };
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Registration failed"));
    }
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials, {
        withCredentials: true,
      });
      const { user, accessToken, requiresTwoFactor, challengeToken } =
        response.data.data;

      if (requiresTwoFactor) {
        return {
          requiresTwoFactor: true,
          challengeToken,
          email: response.data.data?.email || credentials.email,
        };
      }

      setTokenInStorage(accessToken);
      return { user, accessToken };
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Login failed"));
    }
  },
);

export const verifyTwoFactorLogin = createAsyncThunk(
  "auth/verifyTwoFactorLogin",
  async ({ challengeToken, code }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/verify-2fa`,
        {
          challengeToken,
          code,
        },
        {
          withCredentials: true,
        },
      );

      const { user, accessToken } = response.data.data;
      setTokenInStorage(accessToken);

      return { user, accessToken };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "2FA verification failed"),
      );
    }
  },
);

export const resendVerification = createAsyncThunk(
  "auth/resendVerification",
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/resend-verification`, {
        email,
      });
      return response.data.message;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Could not resend verification email"),
      );
    }
  },
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/forgotpassword`, {
        email,
      });

      return response.data.message;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to send reset link"),
      );
    }
  },
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/auth/resetpassword/${token}`, {
        password,
      });
      return response.data.message || "Password reset successful";
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Password reset failed"),
      );
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await axios.post(
        `${API_URL}/auth/logout`,
        {},
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
        },
      );
      removeTokensFromStorage();
    } catch (error) {
      removeTokensFromStorage();
      return rejectWithValue(error.response?.data?.error || "Logout failed");
    }
  },
);

export const refreshAccessToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const { accessToken } = response.data.data;
      setTokenInStorage(accessToken);
      return { accessToken };
    } catch {
      removeTokensFromStorage();
      return rejectWithValue("Token refresh failed");
    }
  },
);

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });
      return response.data.data;
    } catch (error) {
      const detailedMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        (error?.message === "Network Error"
          ? `Cannot reach backend API. Check VITE_API_URL (${API_URL}).`
          : error?.message);
      return rejectWithValue(detailedMessage || "Failed to get user");
    }
  },
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (userData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.put(`${API_URL}/users/profile`, userData, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Profile update failed",
      );
    }
  },
);

export const updateTwoFactorSetting = createAsyncThunk(
  "auth/updateTwoFactorSetting",
  async ({ enabled, currentPassword }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.put(
        `${API_URL}/users/two-factor`,
        { enabled, currentPassword },
        {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
        },
      );

      return {
        enabled: response.data?.data?.twoFactorEnabled,
        message: response.data?.message,
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update two-factor settings"),
      );
    }
  },
);

export const deleteAccount = createAsyncThunk(
  "auth/deleteAccount",
  async ({ currentPassword }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.delete(`${API_URL}/users/me`, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
        data: {
          currentPassword,
        },
      });

      removeTokensFromStorage();
      return response.data?.message || "Account deleted successfully";
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to delete account"),
      );
    }
  },
);

export const uploadProfilePhoto = createAsyncThunk(
  "auth/uploadProfilePhoto",
  async (file, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();

      if (!auth.accessToken) {
        return rejectWithValue("Not authorized, no token");
      }

      const formData = new FormData();
      formData.append("image", file);

      const uploadResponse = await axios.post(
        `${API_URL}/upload/avatar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
        },
      );

      const updatedUser = uploadResponse?.data?.data?.user;
      if (!updatedUser) {
        return rejectWithValue("Image upload failed");
      }

      return updatedUser;
    } catch (error) {
      const serverMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        `${error?.message || "Request failed"}${error?.config?.url ? ` (${error.config.url})` : ""}`;
      return rejectWithValue(serverMessage || "Profile photo upload failed");
    }
  },
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (passwordData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await axios.put(`${API_URL}/users/changepassword`, passwordData, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });
      return "Password changed successfully";
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Password change failed",
      );
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      setTokenInStorage(accessToken);
    },
    logoutUser: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.twoFactorChallengeToken = null;
      state.twoFactorEmail = "";
      state.hasCheckedAuth = true;
      removeTokensFromStorage();
    },
    clearTwoFactorChallenge: (state) => {
      state.twoFactorChallengeToken = null;
      state.twoFactorEmail = "";
    },
    setAuthChecked: (state, action) => {
      state.hasCheckedAuth = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.hasCheckedAuth = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload.requiresTwoFactor) {
          state.twoFactorChallengeToken = action.payload.challengeToken;
          state.twoFactorEmail = action.payload.email || "";
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
          state.hasCheckedAuth = false;
          return;
        }

        state.twoFactorChallengeToken = null;
        state.twoFactorEmail = "";
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = null;
        state.hasCheckedAuth = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(verifyTwoFactorLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyTwoFactorLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = null;
        state.twoFactorChallengeToken = null;
        state.twoFactorEmail = "";
        state.hasCheckedAuth = true;
      })
      .addCase(verifyTwoFactorLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.hasCheckedAuth = true;
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.hasCheckedAuth = true;
      })
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.hasCheckedAuth = true;
      })
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.hasCheckedAuth = true;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.hasCheckedAuth = true;
      })
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateTwoFactorSetting.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTwoFactorSetting.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user) {
          state.user.twoFactorEnabled = Boolean(action.payload.enabled);
        }
      })
      .addCase(updateTwoFactorSetting.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.twoFactorChallengeToken = null;
        state.twoFactorEmail = "";
        state.hasCheckedAuth = true;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(uploadProfilePhoto.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadProfilePhoto.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(uploadProfilePhoto.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setCredentials,
  logoutUser,
  clearTwoFactorChallenge,
  setAuthChecked,
} = authSlice.actions;

export const selectAuthUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => !!state.auth.user;
export const selectAuthIsLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthChecked = (state) => state.auth.hasCheckedAuth;
export const selectTwoFactorChallengeToken = (state) =>
  state.auth.twoFactorChallengeToken;
export const selectTwoFactorEmail = (state) => state.auth.twoFactorEmail;

export default authSlice.reducer;
