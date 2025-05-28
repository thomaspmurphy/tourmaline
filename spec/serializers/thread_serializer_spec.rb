require 'rails_helper'

RSpec.describe ThreadSerializer do
  let(:user) { FactoryBot.create(:user, username: 'alice') }
  let(:thread) { FactoryBot.create(:forum_thread, user: user, title: 'Test Thread', content: 'Thread content') }

  describe '.call' do
    context 'when include_posts is false (default)' do
      it 'serializes the thread without posts' do
        result = described_class.call(thread)
        expect(result).to include(
          id: thread.id,
          title: 'Test Thread',
          content: 'Thread content',
          user_id: user.id,
          posts_count: 0,
          user: { id: user.id, username: 'alice' }
        )
        expect(result).not_to have_key(:posts)
      end
    end

    context 'when include_posts is true' do
      it 'serializes the thread with posts' do
        post1 = FactoryBot.create(:post, forum_thread: thread, user: user, content: 'First post')
        post2 = FactoryBot.create(:post, forum_thread: thread, user: user, content: 'Second post')
        result = described_class.call(thread, include_posts: true)
        expect(result[:posts].size).to eq(2)
        expect(result[:posts].map { |p| p[:content] }).to contain_exactly('First post', 'Second post')
      end
    end
  end
end
