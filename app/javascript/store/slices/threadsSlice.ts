import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { apiService, Thread, Post } from '../../services/api'

interface ThreadWithPosts extends Thread {
  posts?: Post[]
}

export interface ThreadsState {
  threads: Thread[]
  currentThread: ThreadWithPosts | null
  loading: boolean
  error: string | null
}

const initialState: ThreadsState = {
  threads: [],
  currentThread: null,
  loading: false,
  error: null
}

// Async thunks
export const fetchThreads = createAsyncThunk(
  'threads/fetchThreads',
  async () => {
    return await apiService.getThreads()
  }
)

export const fetchThread = createAsyncThunk(
  'threads/fetchThread',
  async (id: number) => {
    return await apiService.getThread(id)
  }
)

export const createThread = createAsyncThunk(
  'threads/createThread',
  async (data: { title: string; content: string }) => {
    return await apiService.createThread(data)
  }
)

export const createPost = createAsyncThunk(
  'threads/createPost',
  async ({ threadId, content }: { threadId: number; content: string }) => {
    return await apiService.createPost(threadId, content)
  }
)

const threadsSlice = createSlice({
  name: 'threads',
  initialState,
  reducers: {
    clearCurrentThread: (state) => {
      state.currentThread = null
    },
    clearError: (state) => {
      state.error = null
    },
    upsertThread: (state, action: PayloadAction<Thread>) => {
      // Remove if exists, then unshift (add to top)
      state.threads = state.threads.filter(t => t.id !== action.payload.id)
      state.threads.unshift(action.payload)
    },
    addPostToCurrentThread: (state, action: PayloadAction<Post>) => {
      if (state.currentThread) {
        if (!state.currentThread.posts) state.currentThread.posts = []
        state.currentThread.posts.push(action.payload)
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch threads
      .addCase(fetchThreads.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchThreads.fulfilled, (state, action) => {
        state.loading = false
        state.threads = action.payload
      })
      .addCase(fetchThreads.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch threads'
      })
      
      // Fetch single thread
      .addCase(fetchThread.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchThread.fulfilled, (state, action) => {
        state.loading = false
        state.currentThread = action.payload
      })
      .addCase(fetchThread.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch thread'
      })
      
      // Create thread
      .addCase(createThread.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createThread.fulfilled, (state, action) => {
        state.loading = false
        state.threads.unshift(action.payload)
      })
      .addCase(createThread.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create thread'
      })
      
      // Create post
      .addCase(createPost.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.loading = false
        if (state.currentThread) {
          if (!state.currentThread.posts) {
            state.currentThread.posts = []
          }
          state.currentThread.posts.push(action.payload)
        }
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create post'
      })
  }
})

export const { clearCurrentThread, clearError, upsertThread, addPostToCurrentThread } = threadsSlice.actions
export default threadsSlice.reducer 