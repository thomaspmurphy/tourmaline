require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'validations' do
    subject { build(:user) }

    it { should validate_presence_of(:email) }
    it { should validate_presence_of(:username) }
    it { should validate_uniqueness_of(:email).case_insensitive }
    it { should validate_uniqueness_of(:username).case_insensitive }
    it { should validate_length_of(:username).is_at_least(3).is_at_most(20) }
    it { should allow_value('user@example.com').for(:email) }
    it { should_not allow_value('invalid_email').for(:email) }
  end

  describe 'associations' do
    it { should have_many(:forum_threads).dependent(:destroy) }
    it { should have_many(:posts).dependent(:destroy) }
  end

  describe 'factory' do
    it 'creates a valid user' do
      user = build(:user)
      expect(user).to be_valid
    end

    it 'creates unique emails and usernames' do
      user1 = create(:user)
      user2 = create(:user)

      expect(user1.email).not_to eq(user2.email)
      expect(user1.username).not_to eq(user2.username)
    end
  end

  describe 'traits' do
    it 'creates user with threads' do
      user = create(:user, :with_threads)
      expect(user.forum_threads.count).to eq(3)
    end

    it 'creates user with posts' do
      user = create(:user, :with_posts)
      expect(user.posts.count).to eq(2)
    end
  end

  describe 'username validation' do
    it 'allows alphanumeric usernames' do
      user = build(:user, username: 'user123')
      expect(user).to be_valid
    end

    it 'allows underscores in usernames' do
      user = build(:user, username: 'user_name')
      expect(user).to be_valid
    end

    it 'rejects usernames that are too short' do
      user = build(:user, username: 'ab')
      expect(user).not_to be_valid
      expect(user.errors[:username]).to include('is too short (minimum is 3 characters)')
    end

    it 'rejects usernames that are too long' do
      user = build(:user, username: 'a' * 21)
      expect(user).not_to be_valid
      expect(user.errors[:username]).to include('is too long (maximum is 20 characters)')
    end
  end

  describe 'case insensitive uniqueness' do
    let!(:existing_user) { create(:user, email: 'test@example.com', username: 'testuser') }

    it 'rejects duplicate email with different case' do
      user = build(:user, email: 'TEST@EXAMPLE.COM')
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include('has already been taken')
    end

    it 'rejects duplicate username with different case' do
      user = build(:user, username: 'TESTUSER')
      expect(user).not_to be_valid
      expect(user.errors[:username]).to include('has already been taken')
    end
  end
end
