require 'rails_helper'

RSpec.describe 'Api::V1::ThreadsController', type: :request do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }

  describe 'GET /api/v1/threads' do
    let!(:threads) { create_list(:forum_thread, 3, :with_posts) }

    it 'returns all threads' do
      get '/api/v1/threads'

      expect(response).to have_http_status(:ok)
      expect(json_response.length).to eq(3)
    end

    it 'includes thread details' do
      get '/api/v1/threads'

      thread_response = json_response.first
      expect(thread_response).to include(
        'id', 'title', 'content', 'user_id', 'created_at', 'updated_at', 'posts_count', 'user'
      )
      expect(thread_response['user']).to include('id', 'username')
    end

    it 'orders threads by created_at desc' do
      # Use travel_to to ensure proper ordering
      old_thread = nil
      new_thread = nil

      travel_to 2.hours.ago do
        old_thread = create(:forum_thread)
      end

      travel_to 10.minutes.ago do
        new_thread = create(:forum_thread)
      end

      get '/api/v1/threads'

      thread_ids = json_response.map { |t| t['id'] }
      expect(thread_ids).to include(new_thread.id, old_thread.id)
      expect(thread_ids.index(new_thread.id)).to be < thread_ids.index(old_thread.id)
    end

    it 'includes posts count' do
      thread_with_posts = create(:forum_thread, :with_posts)

      get '/api/v1/threads'

      thread_response = json_response.find { |t| t['id'] == thread_with_posts.id }
      expect(thread_response['posts_count']).to eq(3)
    end
  end

  describe 'GET /api/v1/threads/:id' do
    let(:thread) { create(:forum_thread, :with_posts) }

    it 'returns the thread with posts' do
      get "/api/v1/threads/#{thread.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response['id']).to eq(thread.id)
      expect(json_response['posts']).to be_present
      expect(json_response['posts'].length).to eq(3)
    end

    it 'includes post details' do
      get "/api/v1/threads/#{thread.id}"

      post_response = json_response['posts'].first
      expect(post_response).to include(
        'id', 'content', 'user_id', 'thread_id', 'created_at', 'updated_at', 'user'
      )
      expect(post_response['user']).to include('id', 'username')
    end

    it 'orders posts by created_at asc' do
      thread = create(:forum_thread)
      old_post = create(:post, forum_thread: thread, created_at: 1.hour.ago)
      new_post = create(:post, forum_thread: thread, created_at: 10.minutes.ago)

      get "/api/v1/threads/#{thread.id}"

      post_ids = json_response['posts'].map { |p| p['id'] }
      expect(post_ids.first).to eq(old_post.id)
      expect(post_ids.last).to eq(new_post.id)
    end

    it 'returns 404 for non-existent thread' do
      get '/api/v1/threads/999999'

      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'POST /api/v1/threads' do
    let(:valid_attributes) do
      {
        thread: {
          title: 'New Thread Title',
          content: 'This is the content of the new thread.'
        }
      }
    end

    context 'when authenticated' do
      it 'creates a new thread' do
        expect {
          post '/api/v1/threads', params: valid_attributes, headers: auth_headers(user)
        }.to change(ForumThread, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response['title']).to eq('New Thread Title')
        expect(json_response['user_id']).to eq(user.id)
      end

      it 'returns thread details' do
        post '/api/v1/threads', params: valid_attributes, headers: auth_headers(user)

        expect(json_response).to include(
          'id', 'title', 'content', 'user_id', 'created_at', 'updated_at', 'posts_count', 'user'
        )
        expect(json_response['user']['username']).to eq(user.username)
      end

      it 'returns errors for invalid attributes' do
        invalid_attributes = { thread: { title: '', content: '' } }

        post '/api/v1/threads', params: invalid_attributes, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response['errors']).to be_present
      end

      it 'validates title length' do
        invalid_attributes = { thread: { title: 'Hi', content: 'Valid content here' } }

        post '/api/v1/threads', params: invalid_attributes, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response['errors']).to include('Title is too short (minimum is 5 characters)')
      end

      it 'validates content length' do
        invalid_attributes = { thread: { title: 'Valid Title', content: 'Short' } }

        post '/api/v1/threads', params: invalid_attributes, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response['errors']).to include('Content is too short (minimum is 10 characters)')
      end
    end

    context 'when not authenticated' do
      it 'returns unauthorized' do
        post '/api/v1/threads', params: valid_attributes

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'PUT /api/v1/threads/:id' do
    let(:thread) { create(:forum_thread, user: user) }
    let(:update_attributes) do
      {
        thread: {
          title: 'Updated Thread Title',
          content: 'Updated thread content.'
        }
      }
    end

    context 'when authenticated as thread owner' do
      it 'updates the thread' do
        put "/api/v1/threads/#{thread.id}", params: update_attributes, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response['title']).to eq('Updated Thread Title')
        expect(json_response['content']).to eq('Updated thread content.')
      end

      it 'returns errors for invalid attributes' do
        invalid_attributes = { thread: { title: '', content: '' } }

        put "/api/v1/threads/#{thread.id}", params: invalid_attributes, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response['errors']).to be_present
      end
    end

    context 'when authenticated as different user' do
      it 'returns not found' do
        put "/api/v1/threads/#{thread.id}", params: update_attributes, headers: auth_headers(other_user)

        expect(response).to have_http_status(:not_found)
      end
    end

    context 'when not authenticated' do
      it 'returns unauthorized' do
        put "/api/v1/threads/#{thread.id}", params: update_attributes

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'DELETE /api/v1/threads/:id' do
    let!(:thread) { create(:forum_thread, user: user) }

    context 'when authenticated as thread owner' do
      it 'deletes the thread' do
        expect {
          delete "/api/v1/threads/#{thread.id}", headers: auth_headers(user)
        }.to change(ForumThread, :count).by(-1)

        expect(response).to have_http_status(:no_content)
      end
    end

    context 'when authenticated as different user' do
      it 'returns not found' do
        delete "/api/v1/threads/#{thread.id}", headers: auth_headers(other_user)

        expect(response).to have_http_status(:not_found)
      end
    end

    context 'when not authenticated' do
      it 'returns unauthorized' do
        delete "/api/v1/threads/#{thread.id}"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
