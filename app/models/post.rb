class Post < ApplicationRecord
  belongs_to :user
  belongs_to :forum_thread

  validates :content, presence: true, length: { minimum: 1, maximum: 5000 }

  after_create :update_thread_activity
  after_update :update_thread_activity

  private

  def update_thread_activity
    forum_thread.update_column(:last_activity_at, Time.current)
  end
end
