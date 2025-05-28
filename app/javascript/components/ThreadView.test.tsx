import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockThread, mockUser, mockPost } from '../test/utils'
import ThreadView from './ThreadView'

// Mock the Redux actions
const mockFetchThread = vi.fn()
const mockCreatePost = vi.fn()
const mockClearCurrentThread = vi.fn()

vi.mock('../store/slices/threadsSlice', async () => {
  const actual = await vi.importActual('../store/slices/threadsSlice')
  return {
    ...actual,
    fetchThread: () => mockFetchThread,
    createPost: () => mockCreatePost,
    clearCurrentThread: () => mockClearCurrentThread,
  }
})

describe('ThreadView', () => {
  const mockOnBack = vi.fn()
  const threadId = 1
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    const preloadedState = {
      threads: {
        threads: [],
        currentThread: null,
        loading: true,
        error: null,
      },
      users: {
        isAuthenticated: false,
        currentUser: null,
        loading: false,
        error: null,
      },
    }

    renderWithProviders(<ThreadView threadId={threadId} onBack={mockOnBack} />, {
      preloadedState,
    })
    
    expect(screen.getByText('Loading thread...')).toBeInTheDocument()
  })

  it('renders thread not found when no current thread', () => {
    const preloadedState = {
      threads: {
        threads: [],
        currentThread: null,
        loading: false,
        error: null,
      },
      users: {
        isAuthenticated: false,
        currentUser: null,
        loading: false,
        error: null,
      },
    }

    renderWithProviders(<ThreadView threadId={threadId} onBack={mockOnBack} />, {
      preloadedState,
    })

    expect(screen.getByText('Thread not found')).toBeInTheDocument()
    expect(screen.getByText('Back to Threads')).toBeInTheDocument()
  })

  it('renders error state', () => {
    const preloadedState = {
      threads: {
        threads: [],
        currentThread: null,
        loading: false,
        error: 'Failed to load thread',
      },
      users: {
        isAuthenticated: false,
        currentUser: null,
        loading: false,
        error: null,
      },
    }

    renderWithProviders(<ThreadView threadId={threadId} onBack={mockOnBack} />, {
      preloadedState,
    })

    expect(screen.getByText('Error: Failed to load thread')).toBeInTheDocument()
  })

  it('renders thread with posts', () => {
    const threadWithPosts = {
      ...mockThread,
      posts: [mockPost, { ...mockPost, id: 2, content: 'Second post' }],
    }

    const preloadedState = {
      threads: {
        threads: [],
        currentThread: threadWithPosts,
        loading: false,
        error: null,
      },
      users: {
        isAuthenticated: false,
        currentUser: null,
        loading: false,
        error: null,
      },
    }

    renderWithProviders(<ThreadView threadId={threadId} onBack={mockOnBack} />, {
      preloadedState,
    })

    expect(screen.getByText('Test Thread')).toBeInTheDocument()
    expect(screen.getByText('This is a test thread content.')).toBeInTheDocument()
    expect(screen.getByText('Replies (2)')).toBeInTheDocument()
    expect(screen.getByText('This is a test post.')).toBeInTheDocument()
    expect(screen.getByText('Second post')).toBeInTheDocument()
  })

  it('renders empty posts state', () => {
    const threadWithoutPosts = {
      ...mockThread,
      posts: [],
    }

    const preloadedState = {
      threads: {
        threads: [],
        currentThread: threadWithoutPosts,
        loading: false,
        error: null,
      },
      users: {
        isAuthenticated: false,
        currentUser: null,
        loading: false,
        error: null,
      },
    }

    renderWithProviders(<ThreadView threadId={threadId} onBack={mockOnBack} />, {
      preloadedState,
    })

    expect(screen.getByText('No replies yet')).toBeInTheDocument()
    expect(screen.getByText('Be the first to share your thoughts!')).toBeInTheDocument()
  })

  it('shows login prompt for unauthenticated users', () => {
    const preloadedState = {
      threads: {
        threads: [],
        currentThread: mockThread,
        loading: false,
        error: null,
      },
      users: {
        isAuthenticated: false,
        currentUser: null,
        loading: false,
        error: null,
      },
    }

    renderWithProviders(<ThreadView threadId={threadId} onBack={mockOnBack} />, {
      preloadedState,
    })

    expect(screen.getByText('You need to be logged in to reply')).toBeInTheDocument()
    expect(screen.getByText('Login to Reply')).toBeInTheDocument()
  })

  it('shows reply form for authenticated users', () => {
    const preloadedState = {
      threads: {
        threads: [],
        currentThread: mockThread,
        loading: false,
        error: null,
      },
      users: {
        isAuthenticated: true,
        currentUser: mockUser,
        loading: false,
        error: null,
      },
    }

    renderWithProviders(<ThreadView threadId={threadId} onBack={mockOnBack} />, {
      preloadedState,
    })

    expect(screen.getByText('Add Your Reply')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('What are your thoughts? Be respectful and constructive...')).toBeInTheDocument()
    expect(screen.getByText('Post Reply')).toBeInTheDocument()
  })

  it('handles reply form submission', async () => {
    const user = userEvent.setup()
    
    const preloadedState = {
      threads: {
        threads: [],
        currentThread: mockThread,
        loading: false,
        error: null,
      },
      users: {
        isAuthenticated: true,
        currentUser: mockUser,
        loading: false,
        error: null,
      },
    }

    renderWithProviders(<ThreadView threadId={threadId} onBack={mockOnBack} />, {
      preloadedState,
    })

    const textarea = screen.getByPlaceholderText('What are your thoughts? Be respectful and constructive...')
    const submitButton = screen.getByText('Post Reply')

    await user.type(textarea, 'This is my reply')
    await user.click(submitButton)

    // The form should be submitted and textarea cleared
    expect(textarea).toHaveValue('')
  })

  it('disables submit button when textarea is empty', () => {
    const preloadedState = {
      threads: {
        threads: [],
        currentThread: mockThread,
        loading: false,
        error: null,
      },
      users: {
        isAuthenticated: true,
        currentUser: mockUser,
        loading: false,
        error: null,
      },
    }

    renderWithProviders(<ThreadView threadId={threadId} onBack={mockOnBack} />, {
      preloadedState,
    })

    const submitButton = screen.getByText('Post Reply')
    expect(submitButton).toBeDisabled()
  })

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup()
    
    const preloadedState = {
      threads: {
        threads: [],
        currentThread: mockThread,
        loading: false,
        error: null,
      },
      users: {
        isAuthenticated: false,
        currentUser: null,
        loading: false,
        error: null,
      },
    }

    renderWithProviders(<ThreadView threadId={threadId} onBack={mockOnBack} />, {
      preloadedState,
    })

    const backButton = screen.getByText('Back to Threads')
    await user.click(backButton)

    expect(mockOnBack).toHaveBeenCalled()
  })

  it('displays thread metadata correctly', () => {
    const preloadedState = {
      threads: {
        threads: [],
        currentThread: {
          ...mockThread,
          posts: [mockPost, mockPost],
        },
        loading: false,
        error: null,
      },
      users: {
        isAuthenticated: false,
        currentUser: null,
        loading: false,
        error: null,
      },
    }

    renderWithProviders(<ThreadView threadId={threadId} onBack={mockOnBack} />, {
      preloadedState,
    })

    // Check that testuser appears multiple times (thread author + post authors)
    const usernames = screen.getAllByText('testuser')
    expect(usernames.length).toBeGreaterThan(0)
    expect(screen.getByText('2 replies')).toBeInTheDocument()
  })

  it('shows character count in reply form', async () => {
    const user = userEvent.setup()
    
    const preloadedState = {
      threads: {
        threads: [],
        currentThread: mockThread,
        loading: false,
        error: null,
      },
      users: {
        isAuthenticated: true,
        currentUser: mockUser,
        loading: false,
        error: null,
      },
    }

    renderWithProviders(<ThreadView threadId={threadId} onBack={mockOnBack} />, {
      preloadedState,
    })

    const textarea = screen.getByPlaceholderText('What are your thoughts? Be respectful and constructive...')
    
    expect(screen.getByText('0/1000 characters')).toBeInTheDocument()
    
    await user.type(textarea, 'Hello')
    expect(screen.getByText('5/1000 characters')).toBeInTheDocument()
  })
}) 