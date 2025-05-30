import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Thread } from "@/store/slices/threadsSlice";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface ThreadCardProps {
  thread: Thread;
}

const ThreadCard: React.FC<ThreadCardProps> = ({ thread }) => {
  const users = useSelector((state: RootState) => state.users.users);
  const author = users.find((u) => u.id === thread.userId);
  const latestPosts = thread.posts.slice(-2);

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={author?.avatarUrl || undefined} />
            <AvatarFallback>
              {author?.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{thread.title}</h3>
            <p className="text-sm text-muted-foreground">
              Posted by {author?.username} •{" "}
              {formatDistanceToNow(new Date(thread.createdAt))} ago
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {latestPosts.map((post) => {
          const postAuthor = users.find((u) => u.id === post.userId);
          return (
            <div key={post.id} className="mb-4 last:mb-0">
              <div className="flex items-center space-x-2 mb-1">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={postAuthor?.avatarUrl || undefined} />
                  <AvatarFallback>
                    {postAuthor?.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {postAuthor?.username}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.createdAt))} ago
                </span>
              </div>
              <p className="text-sm pl-8">{post.content}</p>
            </div>
          );
        })}
      </CardContent>

      <CardFooter>
        <div className="text-sm text-muted-foreground">
          {thread.posts.length} posts • Last activity{" "}
          {formatDistanceToNow(new Date(thread.lastActivityAt))} ago
        </div>
      </CardFooter>
    </Card>
  );
};

export default ThreadCard;
