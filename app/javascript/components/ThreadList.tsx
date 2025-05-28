import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { fetchThreads, createThread, upsertThread } from '../store/slices/threadsSlice'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { formatDistanceToNow } from 'date-fns'
import AuthModal from './AuthModal'
import cable from '../services/cable'

interface ThreadListProps {
  onThreadClick: (threadId: number) => void
}

const ThreadList: React.FC<ThreadListProps> = ({ onThreadClick }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { threads, loading, error } = useSelector((state: RootState) => state.threads)
  const { isAuthenticated } = useSelector((state: RootState) => state.users)
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [newThread, setNewThread] = useState({ title: '', content: '' })

  useEffect(() => {
    dispatch(fetchThreads())

    // Subscribe to ThreadsChannel for real-time updates
    const subscription = cable.subscriptions.create(
      { channel: 'ThreadsChannel' },
      {
        received: (data: unknown) => {
          console.log("[ActionCable] Received data:", data);
          if (typeof data === 'object' && data !== null && 'thread' in data) {
            // @ts-expect-error: thread type is not known
            dispatch(upsertThread(data.thread));
          }
        }
      }
    )
    return () => {
      subscription.unsubscribe()
    }
  }, [dispatch])

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newThread.title.trim() && newThread.content.trim()) {
      try {
        await dispatch(createThread(newThread))
        setNewThread({ title: '', content: '' })
        setIsCreateDialogOpen(false)
      } catch (err) {
        console.error('Failed to create thread:', err)
      }
    }
  }

  const handleNewThreadClick = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true)
    } else {
      setIsCreateDialogOpen(true)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">Loading threads...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center text-destructive">Error: {error}</div>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Recent Discussions</h2>
            <p className="text-muted-foreground">Browse and join conversations</p>
          </div>
          
          <Button onClick={handleNewThreadClick}>
            New Thread
          </Button>
        </div>

        <div className="space-y-4">
          {threads.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No threads yet. Be the first to start a discussion!</p>
              </CardContent>
            </Card>
          ) : (
            threads.map((thread) => (
              <Card 
                key={thread.id} 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => onThreadClick(thread.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{thread.title}</CardTitle>
                      <CardDescription>
                        by {thread.user.username} • {formatDistanceToNow(new Date(thread.created_at))} ago
                      </CardDescription>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {thread.posts_count} {thread.posts_count === 1 ? 'reply' : 'replies'}
                    </div>
                  </div>
                </CardHeader>
                {thread.content && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {thread.content}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create Thread Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Thread</DialogTitle>
            <DialogDescription>
              Start a new discussion topic
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateThread} className="space-y-4">
            <Input
              placeholder="Thread title"
              value={newThread.title}
              onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
              required
            />
            <Textarea
              placeholder="What would you like to discuss?"
              value={newThread.content}
              onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
              required
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Thread</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Auth Modal for unauthenticated users */}
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen} 
      />
    </>
  )
}

export default ThreadList 