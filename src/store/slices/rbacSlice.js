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
        const payload = action.payload;
        state.users = Array.isArray(payload) ? payload : (payload.results || []);
        state.usersCount = payload.count || (Array.isArray(payload) ? payload.length : 0);
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.users = []; // Ensure users is always an array
        state.usersCount = 0;
      })
      
      // Roles
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = Array.isArray(action.payload) ? action.payload : (action.payload.results || []);
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.roles = []; // Ensure roles is always an array
      })
      
      // Permissions
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions = Array.isArray(action.payload) ? action.payload : (action.payload.results || []);
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.permissions = []; // Ensure permissions is always an array
      })
      
      // Modules
      .addCase(fetchModules.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchModules.fulfilled, (state, action) => {
        state.loading = false;
        state.modules = Array.isArray(action.payload) ? action.payload : (action.payload.results || []);
      })
      .addCase(fetchModules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.modules = []; // Ensure modules is always an array
      })
      
      // Stats
      .addCase(fetchUserStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError } = rbacSlice.actions;
export default rbacSlice.reducer;
