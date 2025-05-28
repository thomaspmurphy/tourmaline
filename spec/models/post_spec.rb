require 'rails_helper'

RSpec.describe Post, type: :model do
  describe 'validations' do
    subject { build(:post) }

    it { should validate_presence_of(:content) }
    it { should validate_length_of(:content).is_at_least(1).is_at_most(5000) }
  end

  describe 'associations' do
    it { should belong_to(:user) }
    it { should belong_to(:forum_thread) }
  end

  describe 'factory' do
    it 'creates a valid post' do
      post = build(:post)
      expect(post).to be_valid
    end

    it 'creates post with associated user and thread' do
      post = create(:post)
      expect(post.user).to be_present
      expect(post.forum_thread).to be_present
      expect(post.user).to be_a(User)
      expect(post.forum_thread).to be_a(ForumThread)
    end
  end

  describe 'traits' do
    it 'creates post with long content' do
      post = create(:post, :long_content)
      expect(post.content.length).to be > 100
    end

    it 'creates post with short content' do
      post = create(:post, :short_content)
      expect(post.content.length).to be < 50
    end

    it 'creates recent post' do
      post = create(:post, :recent)
      expect(post.created_at).to be > 1.hour.ago
    end
  end

  describe 'content validation' do
    it 'rejects empty content' do
      post = build(:post, content: '')
      expect(post).not_to be_valid
      expect(post.errors[:content]).to include("can't be blank")
    end

    it 'rejects content that is too long' do
      post = build(:post, content: 'a' * 5001)
      expect(post).not_to be_valid
      expect(post.errors[:content]).to include('is too long (maximum is 5000 characters)')
    end

    it 'accepts valid content length' do
      post = build(:post, content: 'This is a valid post content.')
      expect(post).to be_valid
    end

    it 'accepts content with exactly 5000 characters' do
      post = build(:post, content: 'a' * 5000)
      expect(post).to be_valid
    end
  end

  describe 'callbacks' do
    let(:thread) { create(:forum_thread) }

    it 'updates thread last_activity_at after creation' do
      original_time = thread.last_activity_at

      travel_to 1.hour.from_now do
        create(:post, forum_thread: thread)
        thread.reload
        expect(thread.last_activity_at).to be > original_time
      end
    end
  end

  describe 'ordering' do
    let(:thread) { create(:forum_thread) }
    let!(:first_post) { create(:post, forum_thread: thread, created_at: 1.hour.ago) }
    let!(:second_post) { create(:post, forum_thread: thread, created_at: 30.minutes.ago) }
    let!(:third_post) { create(:post, forum_thread: thread, created_at: 10.minutes.ago) }

    it 'orders posts by created_at ascending' do
      posts = thread.posts.order(:created_at)
      expect(posts.first).to eq(first_post)
      expect(posts.last).to eq(third_post)
    end
  end

  describe 'thread association' do
    it 'belongs to a forum thread' do
      thread = create(:forum_thread)
      post = create(:post, forum_thread: thread)

      expect(post.forum_thread).to eq(thread)
      expect(thread.posts).to include(post)
    end

    it 'is destroyed when thread is destroyed' do
      thread = create(:forum_thread)
      post = create(:post, forum_thread: thread)
      post_id = post.id

      thread.destroy
      expect(Post.find_by(id: post_id)).to be_nil
    end
  end

  describe 'user association' do
    it 'belongs to a user' do
      user = create(:user)
      post = create(:post, user: user)

      expect(post.user).to eq(user)
      expect(user.posts).to include(post)
    end
  end
end
