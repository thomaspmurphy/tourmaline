# Handles API requests for posts within forum threads. Provides endpoints to:
# - List all posts for a thread (GET /api/v1/threads/:thread_id/posts)
# - Show a single post (GET /api/v1/threads/:thread_id/posts/:id)
# - Create a new post (POST /api/v1/threads/:thread_id/posts)
# - Update a post (PUT/PATCH /api/v1/threads/:thread_id/posts/:id)
# - Delete a post (DELETE /api/v1/threads/:thread_id/posts/:id)
#
# Requires authentication for create, update, and delete actions.
# Broadcasts new posts to ActionCable for real-time updates.
class Api::V1::PostsController < Api::V1::BaseController
  before_action :set_thread
  before_action :set_post, only: [ :update, :destroy ]
  before_action :authorize_post_owner, only: [ :update, :destroy ]

  def create
    @post = @thread.posts.build(post_params)
    @post.user = current_user

    if @post.save
      # Broadcast to ThreadChannel for this thread
      ActionCable.server.broadcast("thread_#{@thread.id}", { post: post_json(@post) }, coder: ActiveSupport::JSON)
      # Broadcast to ThreadsChannel to bump the thread
      ActionCable.server.broadcast("threads", { thread: ThreadSerializer.call(@thread, include_posts: false) }, coder: ActiveSupport::JSON)
      render json: post_json(@post), status: :created
    else
      render json: { errors: @post.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @post.update(post_params)
      render json: post_json(@post)
    else
      render json: { errors: @post.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @post.destroy
    head :no_content
  end

  private

  def set_thread
    @thread = ForumThread.find(params[:thread_id])
  end

  def set_post
    @post = @thread.posts.find(params[:id])
  end

  def authorize_post_owner
    render json: { error: "Not found" }, status: :not_found unless @post.user == current_user
  end

  def post_params
    params.require(:post).permit(:content)
  end

  def post_json(post)
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
