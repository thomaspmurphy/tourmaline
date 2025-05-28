class ThreadChannel < ApplicationCable::Channel
  def subscribed
    stream_from "thread_#{params[:id]}"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end
