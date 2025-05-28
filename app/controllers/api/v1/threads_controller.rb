# Handles API requests for forum threads. Provides endpoints to:
# - List all threads (GET /api/v1/threads)
# - Show a single thread with posts (GET /api/v1/threads/:id)
# - Create a new thread (POST /api/v1/threads)
# - Update a thread (PUT/PATCH /api/v1/threads/:id)
# - Delete a thread (DELETE /api/v1/threads/:id)
#
# Requires authentication for create, update, and delete actions.
# Broadcasts new threads to ActionCable for real-time updates.
class Api::V1::ThreadsController < Api::V1::BaseController
  skip_before_action :authenticate_user!, only: [ :index, :show ]
  before_action :set_thread, only: [ :show, :update, :destroy ]
  before_action :authorize_thread_owner, only: [ :update, :destroy ]

  def index
    @threads = ForumThread.includes(:user, :posts).page(params[:page])
    render json: @threads.map { |thread| ThreadSerializer.call(thread, include_posts: false) }
  end

  def show
    @thread = ForumThread.includes(:user, posts: :user).find(params[:id])
    render json: ThreadSerializer.call(@thread, include_posts: true)
  end

  def create
    @thread = current_user.forum_threads.build(thread_params)

    if @thread.save
      # Broadcast to ThreadsChannel
      ActionCable.server.broadcast("threads", { thread: ThreadSerializer.call(@thread, include_posts: false) }, coder: ActiveSupport::JSON)
      render json: ThreadSerializer.call(@thread, include_posts: false), status: :created
    else
      render json: { errors: @thread.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @thread.update(thread_params)
      render json: ThreadSerializer.call(@thread, include_posts: false)
    else
      render json: { errors: @thread.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @thread.destroy
    head :no_content
  end

  private

  def set_thread
    @thread = ForumThread.find(params[:id])
  end

  def authorize_thread_owner
    render json: { error: "Not found" }, status: :not_found unless @thread.user == current_user
  end

  def thread_params
    params.require(:thread).permit(:title, :content)
  end
end
