require 'rails_helper'

RSpec.describe ForumThread, type: :model do
  describe 'validations' do
    subject { build(:forum_thread) }

    it { should validate_presence_of(:title) }
    it { should validate_presence_of(:content) }
    it { should validate_length_of(:title).is_at_least(5).is_at_most(200) }
    it { should validate_length_of(:content).is_at_least(10).is_at_most(10000) }
  end

  describe 'associations' do
    it { should belong_to(:user) }
    it { should have_many(:posts).dependent(:destroy) }
  end

  describe 'factory' do
    it 'creates a valid forum thread' do
      thread = build(:forum_thread)
      expect(thread).to be_valid
    end

    it 'creates thread with associated user' do
      thread = create(:forum_thread)
      expect(thread.user).to be_present
      expect(thread.user).to be_a(User)
    end
  end

  describe 'traits' do
    it 'creates thread with posts' do
      thread = create(:forum_thread, :with_posts)
      expect(thread.posts.count).to eq(3)
    end

    it 'creates recent thread' do
      thread = create(:forum_thread, :recent)
      expect(thread.created_at).to be > 2.hours.ago
    end

    it 'creates old thread' do
      thread = create(:forum_thread, :old)
      expect(thread.created_at).to be < 1.week.ago
    end
  end

  describe 'scopes and ordering' do
    let!(:old_thread) { create(:forum_thread, :old) }
    let!(:recent_thread) { create(:forum_thread, :recent) }
    let!(:newest_thread) { create(:forum_thread, created_at: 10.minutes.ago) }

    it 'orders by created_at desc by default' do
      threads = ForumThread.all
      expect(threads.first).to eq(newest_thread)
      expect(threads.last).to eq(old_thread)
    end
  end

  describe 'title validation' do
    it 'rejects titles that are too short' do
      thread = build(:forum_thread, title: 'Hi')
      expect(thread).not_to be_valid
      expect(thread.errors[:title]).to include('is too short (minimum is 5 characters)')
    end

    it 'rejects titles that are too long' do
      thread = build(:forum_thread, title: 'a' * 201)
      expect(thread).not_to be_valid
      expect(thread.errors[:title]).to include('is too long (maximum is 200 characters)')
    end

    it 'accepts valid title length' do
      thread = build(:forum_thread, title: 'Valid Thread Title')
      expect(thread).to be_valid
    end
  end

  describe 'content validation' do
    it 'rejects content that is too short' do
      thread = build(:forum_thread, content: 'Short')
      expect(thread).not_to be_valid
      expect(thread.errors[:content]).to include('is too short (minimum is 10 characters)')
    end

    it 'rejects content that is too long' do
      thread = build(:forum_thread, content: 'a' * 10001)
      expect(thread).not_to be_valid
      expect(thread.errors[:content]).to include('is too long (maximum is 10000 characters)')
    end

    it 'accepts valid content length' do
      thread = build(:forum_thread, content: 'This is a valid thread content with enough characters.')
      expect(thread).to be_valid
    end
  end

  describe 'dependent destroy' do
    it 'destroys associated posts when thread is destroyed' do
      thread = create(:forum_thread, :with_posts)
      post_ids = thread.posts.pluck(:id)

      expect { thread.destroy }.to change { Post.count }.by(-3)
      expect(Post.where(id: post_ids)).to be_empty
    end
  end

  describe 'last_activity_at' do
    let(:thread) { create(:forum_thread) }

    it 'updates last_activity_at when a post is created' do
      expect {
        create(:post, forum_thread: thread)
        thread.reload
      }.to change { thread.last_activity_at }
    end
  end
end
