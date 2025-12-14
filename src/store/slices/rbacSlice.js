import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import rbacService from '../../services/rbac.service';

// Async thunks
export const fetchCurrentUser = createAsyncThunk(
  'rbac/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await rbacService.getCurrentUser();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'rbac/fetchUsers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await rbacService.getUsers(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchRoles = createAsyncThunk(
  'rbac/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await rbacService.getRoles();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchPermissions = createAsyncThunk(
  'rbac/fetchPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await rbacService.getPermissions();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchModules = createAsyncThunk(
  'rbac/fetchModules',
  async (_, { rejectWithValue }) => {
    try {
      const response = await rbacService.getModules();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUserStats = createAsyncThunk(
  'rbac/fetchUserStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await rbacService.getUserStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  currentUser: null,
  users: [],
  usersCount: 0,
  roles: [],
  permissions: [],
  modules: [],
  stats: null,
  loading: false,
  error: null
};

const rbacSlice = createSlice({
  name: 'rbac',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Current User
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.results || action.payload;
        state.usersCount = action.payload.count || action.payload.length;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Roles
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.roles = action.payload;
      })
      
      // Permissions
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.permissions = action.payload;
      })
      
      // Modules
      .addCase(fetchModules.fulfilled, (state, action) => {
        state.modules = action.payload;
      })
      
      // Stats
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  }
});

export const { clearError } = rbacSlice.actions;
export default rbacSlice.reducer;
