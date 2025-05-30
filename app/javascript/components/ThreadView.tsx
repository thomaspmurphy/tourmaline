import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store";
import {
  fetchThread,
  createPost,
  clearCurrentThread,
  addPostToCurrentThread,
} from "../store/slices/threadsSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ArrowLeft, MessageSquare, Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import cable from "../services/cable";

interface ThreadViewProps {
  threadId: number;
  onBack: () => void;
}

const ThreadView: React.FC<ThreadViewProps> = ({ threadId, onBack }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentThread, loading, error } = useSelector(
    (state: RootState) => state.threads,
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.users);

  const [newPostContent, setNewPostContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchThread(threadId));

    // Subscribe to ThreadChannel for real-time post updates
    const subscription = cable.subscriptions.create(
      { channel: "ThreadChannel", id: threadId },
      {
        received: (data: unknown) => {
          if (typeof data === "object" && data !== null && "post" in data) {
            // @ts-expect-error: post type is not known
            dispatch(addPostToCurrentThread(data.post));
          }
        },
      },
    );
    return () => {
      subscription.unsubscribe();
      dispatch(clearCurrentThread());
    };
  }, [dispatch, threadId]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPostContent.trim()) {
      setIsSubmitting(true);
      try {
        await dispatch(createPost({ threadId, content: newPostContent }));
        setNewPostContent("");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">Loading thread...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <Button onClick={onBack} variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Threads
        </Button>
        <div className="text-center text-destructive">Error: {error}</div>
      </div>
    );
  }

  if (!currentThread) {
    return (
      <div className="container mx-auto p-8">
        <Button onClick={onBack} variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Threads
        </Button>
        <div className="text-center">Thread not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Button onClick={onBack} variant="outline" className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Threads
      </Button>

      {/* Main Thread Display */}
      <div className="bg-background border rounded-lg p-6 mb-8">
        {/* Thread Title */}
        <h1 className="text-3xl font-bold mb-4 leading-tight">
          {currentThread.title}
        </h1>

        {/* Thread Content */}
        {currentThread.content && (
          <div className="prose prose-gray max-w-none mb-6">
            <p className="text-lg leading-relaxed whitespace-pre-wrap text-foreground">
              {currentThread.content}
            </p>
          </div>
        )}

        {/* Thread Metadata */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="font-medium">{currentThread.user.username}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>
              {formatDistanceToNow(new Date(currentThread.created_at))} ago
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>
              {currentThread.posts?.length || 0}{" "}
              {(currentThread.posts?.length || 0) === 1 ? "reply" : "replies"}
            </span>
          </div>
        </div>
      </div>

      {/* Replies Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Replies ({currentThread.posts?.length || 0})
        </h2>

        {/* Posts */}
        <div className="space-y-4">
          {currentThread.posts && currentThread.posts.length > 0 ? (
            currentThread.posts.map((post, index) => (
              <div key={post.id} className="border-l-2 border-muted pl-6 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {post.user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-medium">{post.user.username}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at))} ago
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">#{index + 1}</span>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No replies yet</p>
              <p className="text-sm">Be the first to share your thoughts!</p>
            </div>
          )}
        </div>

        {/* New Post Form */}
        {isAuthenticated ? (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Add Your Reply</CardTitle>
              <CardDescription>
                Share your thoughts on this discussion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <Textarea
                  placeholder="What are your thoughts? Be respectful and constructive..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  required
                  rows={4}
                  className="resize-none"
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {newPostContent.length}/1000 characters
                  </p>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !newPostContent.trim()}
                  >
                    {isSubmitting ? "Posting..." : "Post Reply"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-8">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                You need to be logged in to reply
              </p>
              <Button variant="outline">Login to Reply</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ThreadView;
