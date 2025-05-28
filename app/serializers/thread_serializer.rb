module ThreadSerializer
  def self.call(thread, include_posts: false)
    result = {
      id: thread.id,
      title: thread.title,
      content: thread.content,
      user_id: thread.user_id,
      created_at: thread.created_at,
      updated_at: thread.updated_at,
      posts_count: thread.posts.size,
      user: {
        id: thread.user.id,
        username: thread.user.username
      }
    }

    if include_posts
      result[:posts] = thread.posts.order(:created_at).map do |post|
        {
          id: post.id,
          content: post.content,
          user_id: post.user_id,
          thread_id: post.forum_thread_id,
          created_at: post.created_at,
          updated_at: post.updated_at,
          user: {
            id: post.user.id,
            username: post.user.username
          }
        }
      end
    end

    result
  end
end
