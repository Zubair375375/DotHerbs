import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export const fetchHeroSlides = createAsyncThunk(
  "heroSlides/fetchActive",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/hero-slides`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch hero slides",
      );
    }
  },
);

export const fetchAllHeroSlides = createAsyncThunk(
  "heroSlides/fetchAll",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.get(`${API_URL}/hero-slides/all`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch hero slides",
      );
    }
  },
);

export const createHeroSlide = createAsyncThunk(
  "heroSlides/create",
  async (slideData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.post(`${API_URL}/hero-slides`, slideData, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to create hero slide",
      );
    }
  },
);

export const updateHeroSlideBadges = createAsyncThunk(
  "heroSlides/updateBadges",
  async ({ id, certificateBadgeImages }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.put(
        `${API_URL}/hero-slides/${id}/badges`,
        { certificateBadgeImages },
        {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        },
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update hero badges",
      );
    }
  },
);

export const deleteHeroSlide = createAsyncThunk(
  "heroSlides/delete",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await axios.delete(`${API_URL}/hero-slides/${id}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to delete hero slide",
      );
    }
  },
);

const heroSlideSlice = createSlice({
  name: "heroSlides",
  initialState: {
    items: [],
    adminItems: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHeroSlides.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHeroSlides.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchHeroSlides.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchAllHeroSlides.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllHeroSlides.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminItems = action.payload;
      })
      .addCase(fetchAllHeroSlides.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createHeroSlide.fulfilled, (state, action) => {
        state.adminItems.unshift(action.payload);
        if (action.payload.isActive) {
          state.items.push(action.payload);
        }
      })
      .addCase(updateHeroSlideBadges.fulfilled, (state, action) => {
        state.adminItems = state.adminItems.map((slide) =>
          slide._id === action.payload._id ? action.payload : slide,
        );
        state.items = state.items.map((slide) =>
          slide._id === action.payload._id ? action.payload : slide,
        );
      })
      .addCase(deleteHeroSlide.fulfilled, (state, action) => {
        state.adminItems = state.adminItems.filter(
          (slide) => slide._id !== action.payload,
        );
        state.items = state.items.filter(
          (slide) => slide._id !== action.payload,
        );
      });
  },
});

export const selectHeroSlides = (state) => state.heroSlides.items;
export const selectAllHeroSlides = (state) => state.heroSlides.adminItems;
export const selectHeroSlidesLoading = (state) => state.heroSlides.isLoading;

export default heroSlideSlice.reducer;

