import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, mockThread, mockUser } from "../test/utils";
import ThreadList from "./ThreadList";

// Mock the Redux actions
const mockFetchThreads = vi.fn();
const mockCreateThread = vi.fn();

vi.mock("../store/slices/threadsSlice", async () => {
  const actual = await vi.importActual("../store/slices/threadsSlice");
  return {
    ...actual,
    fetchThreads: () => mockFetchThreads,
    createThread: () => mockCreateThread,
  };
});

describe("ThreadList", () => {
  const mockOnThreadClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
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
    };

    renderWithProviders(<ThreadList onThreadClick={mockOnThreadClick} />, {
      preloadedState,
    });

    expect(screen.getByText("Loading threads...")).toBeInTheDocument();
  });

  it("renders threads when loaded", async () => {
    const mockThreads = [
      { ...mockThread, id: 1, title: "First Thread" },
      { ...mockThread, id: 2, title: "Second Thread" },
    ];

    const preloadedState = {
      threads: {
        threads: mockThreads,
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
    };

    renderWithProviders(<ThreadList onThreadClick={mockOnThreadClick} />, {
      preloadedState,
    });

    expect(screen.getByText("First Thread")).toBeInTheDocument();
    expect(screen.getByText("Second Thread")).toBeInTheDocument();
    expect(screen.getByText("Recent Discussions")).toBeInTheDocument();
  });

  it("renders empty state when no threads", () => {
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
    };

    renderWithProviders(<ThreadList onThreadClick={mockOnThreadClick} />, {
      preloadedState,
    });

    expect(
      screen.getByText("No threads yet. Be the first to start a discussion!"),
    ).toBeInTheDocument();
  });

  it("renders error state", () => {
    const preloadedState = {
      threads: {
        threads: [],
        currentThread: null,
        loading: false,
        error: "Failed to load threads",
      },
      users: {
        isAuthenticated: false,
        currentUser: null,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<ThreadList onThreadClick={mockOnThreadClick} />, {
      preloadedState,
    });

    expect(
      screen.getByText("Error: Failed to load threads"),
    ).toBeInTheDocument();
  });

  it("calls onThreadClick when thread is clicked", async () => {
    const user = userEvent.setup();
    const mockThreads = [mockThread];

    const preloadedState = {
      threads: {
        threads: mockThreads,
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
    };

    renderWithProviders(<ThreadList onThreadClick={mockOnThreadClick} />, {
      preloadedState,
    });

    const threadCard = screen.getByText("Test Thread");
    await user.click(threadCard);

    expect(mockOnThreadClick).toHaveBeenCalledWith(1);
  });

  it("shows auth modal when unauthenticated user tries to create thread", async () => {
    const user = userEvent.setup();

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
    };

    renderWithProviders(<ThreadList onThreadClick={mockOnThreadClick} />, {
      preloadedState,
    });

    const newThreadButton = screen.getByText("New Thread");
    await user.click(newThreadButton);

    // Check if auth modal appears - it should have login/signup options
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("shows create thread dialog when authenticated user clicks new thread", async () => {
    const user = userEvent.setup();

    const preloadedState = {
      threads: {
        threads: [],
        currentThread: null,
        loading: false,
        error: null,
      },
      users: {
        isAuthenticated: true,
        currentUser: mockUser,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<ThreadList onThreadClick={mockOnThreadClick} />, {
      preloadedState,
    });

    const newThreadButton = screen.getByText("New Thread");
    await user.click(newThreadButton);

    await waitFor(() => {
      expect(screen.getByText("Create New Thread")).toBeInTheDocument();
    });
  });

  it("displays thread metadata correctly", () => {
    const threadWithMetadata = {
      ...mockThread,
      posts_count: 5,
      user: { ...mockUser, username: "author123" },
    };

    const preloadedState = {
      threads: {
        threads: [threadWithMetadata],
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
    };

    renderWithProviders(<ThreadList onThreadClick={mockOnThreadClick} />, {
      preloadedState,
    });

    expect(screen.getByText(/by author123/)).toBeInTheDocument();
    expect(screen.getByText("5 replies")).toBeInTheDocument();
  });

  it("handles singular reply count correctly", () => {
    const threadWithOneReply = {
      ...mockThread,
      posts_count: 1,
    };

    const preloadedState = {
      threads: {
        threads: [threadWithOneReply],
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
    };

    renderWithProviders(<ThreadList onThreadClick={mockOnThreadClick} />, {
      preloadedState,
    });

    expect(screen.getByText("1 reply")).toBeInTheDocument();
  });
});
