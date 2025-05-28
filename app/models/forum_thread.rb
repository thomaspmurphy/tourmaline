class ForumThread < ApplicationRecord
  belongs_to :user
  has_many :posts, dependent: :destroy

  validates :title, presence: true, length: { minimum: 5, maximum: 200 }
  validates :content, presence: true, length: { minimum: 10, maximum: 10000 }

  default_scope { order(last_activity_at: :desc, created_at: :desc) }

  before_create :set_last_activity
  before_save :update_last_activity, if: :saved_change_to_title?

  private

  def set_last_activity
    self.last_activity_at = Time.current
  end

  def update_last_activity
    self.last_activity_at = Time.current
  end
end
