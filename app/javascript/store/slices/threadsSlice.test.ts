import { describe, it, expect, vi, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import threadsReducer, {
  fetchThreads,
  fetchThread,
  createThread,
  createPost,
  clearCurrentThread,
  ThreadsState,
} from './threadsSlice'
import { mockThread, mockPost } from '../../test/utils'

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    getThreads: vi.fn(),
    getThread: vi.fn(),
    createThread: vi.fn(),
    createPost: vi.fn(),
  },
}))

type TestStore = {
  threads: ThreadsState
}

describe('threadsSlice', () => {
  let store: ReturnType<typeof configureStore<TestStore>>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        threads: threadsReducer,
      },
    })
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().threads
      expect(state).toEqual({
        threads: [],
        currentThread: null,
        loading: false,
        error: null,
      })
    })
  })

  describe('clearCurrentThread', () => {
    it('should clear current thread', () => {
      // Set up initial state with a current thread
      store.dispatch({
        type: 'threads/fetchThread/fulfilled',
        payload: mockThread,
      })

      // Clear the current thread
      store.dispatch(clearCurrentThread())

      const state = store.getState().threads
      expect(state.currentThread).toBeNull()
    })
  })

  describe('fetchThreads', () => {
    it('should handle fetchThreads pending', () => {
      store.dispatch({ type: fetchThreads.pending.type })

      const state = store.getState().threads
      expect(state.loading).toBe(true)
      expect(state.error).toBeNull()
    })

    it('should handle fetchThreads fulfilled', () => {
      const mockThreads = [mockThread, { ...mockThread, id: 2 }]

      store.dispatch({
        type: fetchThreads.fulfilled.type,
        payload: mockThreads,
      })

      const state = store.getState().threads
      expect(state.loading).toBe(false)
      expect(state.threads).toEqual(mockThreads)
      expect(state.error).toBeNull()
    })

    it('should handle fetchThreads rejected', () => {
      const errorMessage = 'Failed to fetch threads'

      store.dispatch({
        type: fetchThreads.rejected.type,
        error: { message: errorMessage },
      })

      const state = store.getState().threads
      expect(state.loading).toBe(false)
      expect(state.error).toBe(errorMessage)
    })
  })

  describe('fetchThread', () => {
    it('should handle fetchThread pending', () => {
      store.dispatch({ type: fetchThread.pending.type })

      const state = store.getState().threads
      expect(state.loading).toBe(true)
      expect(state.error).toBeNull()
    })

    it('should handle fetchThread fulfilled', () => {
      store.dispatch({
        type: fetchThread.fulfilled.type,
        payload: mockThread,
      })

      const state = store.getState().threads
      expect(state.loading).toBe(false)
      expect(state.currentThread).toEqual(mockThread)
      expect(state.error).toBeNull()
    })

    it('should handle fetchThread rejected', () => {
      const errorMessage = 'Thread not found'

      store.dispatch({
        type: fetchThread.rejected.type,
        error: { message: errorMessage },
      })

      const state = store.getState().threads
      expect(state.loading).toBe(false)
      expect(state.error).toBe(errorMessage)
    })
  })

  describe('createThread', () => {
    it('should handle createThread pending', () => {
      store.dispatch({ type: createThread.pending.type })

      const state = store.getState().threads
      expect(state.loading).toBe(true)
      expect(state.error).toBeNull()
    })

    it('should handle createThread fulfilled', () => {
      const newThread = { ...mockThread, id: 999 }

      store.dispatch({
        type: createThread.fulfilled.type,
        payload: newThread,
      })

      const state = store.getState().threads
      expect(state.loading).toBe(false)
      expect(state.threads).toContain(newThread)
      expect(state.error).toBeNull()
    })

    it('should handle createThread rejected', () => {
      const errorMessage = 'Failed to create thread'

      store.dispatch({
        type: createThread.rejected.type,
        error: { message: errorMessage },
      })

      const state = store.getState().threads
      expect(state.loading).toBe(false)
      expect(state.error).toBe(errorMessage)
    })
  })

  describe('createPost', () => {
    beforeEach(() => {
      // Set up a current thread
      store.dispatch({
        type: fetchThread.fulfilled.type,
        payload: { ...mockThread, posts: [mockPost] },
      })
    })

    it('should handle createPost pending', () => {
      store.dispatch({ type: createPost.pending.type })

      const state = store.getState().threads
      expect(state.loading).toBe(true)
      expect(state.error).toBeNull()
    })

    it('should handle createPost fulfilled', () => {
      const newPost = { ...mockPost, id: 999, content: 'New post content' }

      store.dispatch({
        type: createPost.fulfilled.type,
        payload: newPost,
      })

      const state = store.getState().threads
      expect(state.loading).toBe(false)
      expect(state.currentThread?.posts).toContain(newPost)
      expect(state.error).toBeNull()
    })

    it('should handle createPost rejected', () => {
      const errorMessage = 'Failed to create post'

      store.dispatch({
        type: createPost.rejected.type,
        error: { message: errorMessage },
      })

      const state = store.getState().threads
      expect(state.loading).toBe(false)
      expect(state.error).toBe(errorMessage)
    })

    it('should not add post if no current thread', () => {
      // Clear current thread
      store.dispatch(clearCurrentThread())

      const newPost = { ...mockPost, id: 999 }

      store.dispatch({
        type: createPost.fulfilled.type,
        payload: newPost,
      })

      const state = store.getState().threads
      expect(state.currentThread).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should handle errors with custom messages', () => {
      const customError = 'Custom error message'

      store.dispatch({
        type: fetchThreads.rejected.type,
        error: { message: customError },
      })

      const state = store.getState().threads
      expect(state.error).toBe(customError)
    })

    it('should handle errors without messages', () => {
      store.dispatch({
        type: fetchThreads.rejected.type,
        error: {},
      })

      const state = store.getState().threads
      expect(state.error).toBe('Failed to fetch threads')
    })
  })
}) 