require 'rails_helper'

RSpec.describe 'Api::V1::PostsController', type: :request do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }
  let(:thread) { create(:forum_thread) }

  describe 'POST /api/v1/threads/:thread_id/posts' do
    let(:valid_attributes) do
      {
        post: {
          content: 'This is a new post content.'
        }
      }
    end

    context 'when authenticated' do
      it 'creates a new post' do
        expect {
          post "/api/v1/threads/#{thread.id}/posts", params: valid_attributes, headers: auth_headers(user)
        }.to change(Post, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response['content']).to eq('This is a new post content.')
        expect(json_response['user_id']).to eq(user.id)
        expect(json_response['thread_id']).to eq(thread.id)
      end

      it 'returns post details' do
        post "/api/v1/threads/#{thread.id}/posts", params: valid_attributes, headers: auth_headers(user)

        expect(json_response).to include(
          'id', 'content', 'user_id', 'thread_id', 'created_at', 'updated_at', 'user'
        )
        expect(json_response['user']['username']).to eq(user.username)
      end

      it 'updates thread last_activity_at' do
        original_time = thread.last_activity_at

        travel_to 1.hour.from_now do
          post "/api/v1/threads/#{thread.id}/posts", params: valid_attributes, headers: auth_headers(user)
          thread.reload
          expect(thread.last_activity_at).to be > original_time
        end
      end

      it 'returns errors for invalid attributes' do
        invalid_attributes = { post: { content: '' } }

        post "/api/v1/threads/#{thread.id}/posts", params: invalid_attributes, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response['errors']).to be_present
      end

      it 'validates content length' do
        invalid_attributes = { post: { content: 'a' * 5001 } }

        post "/api/v1/threads/#{thread.id}/posts", params: invalid_attributes, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response['errors']).to include('Content is too long (maximum is 5000 characters)')
      end

      it 'returns 404 for non-existent thread' do
        post '/api/v1/threads/999999/posts', params: valid_attributes, headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end
    end

    context 'when not authenticated' do
      it 'returns unauthorized' do
        post "/api/v1/threads/#{thread.id}/posts", params: valid_attributes

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'PUT /api/v1/threads/:thread_id/posts/:id' do
    let(:post_record) { create(:post, user: user, forum_thread: thread) }
    let(:update_attributes) do
      {
        post: {
          content: 'Updated post content.'
        }
      }
    end

    context 'when authenticated as post owner' do
      it 'updates the post' do
        put "/api/v1/threads/#{thread.id}/posts/#{post_record.id}",
            params: update_attributes, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response['content']).to eq('Updated post content.')
      end

      it 'returns errors for invalid attributes' do
        invalid_attributes = { post: { content: '' } }

        put "/api/v1/threads/#{thread.id}/posts/#{post_record.id}",
            params: invalid_attributes, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response['errors']).to be_present
      end
    end

    context 'when authenticated as different user' do
      it 'returns not found' do
        put "/api/v1/threads/#{thread.id}/posts/#{post_record.id}",
            params: update_attributes, headers: auth_headers(other_user)

        expect(response).to have_http_status(:not_found)
      end
    end

    context 'when not authenticated' do
      it 'returns unauthorized' do
        put "/api/v1/threads/#{thread.id}/posts/#{post_record.id}", params: update_attributes

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'DELETE /api/v1/threads/:thread_id/posts/:id' do
    let!(:post_record) { create(:post, user: user, forum_thread: thread) }

    context 'when authenticated as post owner' do
      it 'deletes the post' do
        expect {
          delete "/api/v1/threads/#{thread.id}/posts/#{post_record.id}", headers: auth_headers(user)
        }.to change(Post, :count).by(-1)

        expect(response).to have_http_status(:no_content)
      end
    end

    context 'when authenticated as different user' do
      it 'returns not found' do
        delete "/api/v1/threads/#{thread.id}/posts/#{post_record.id}", headers: auth_headers(other_user)

        expect(response).to have_http_status(:not_found)
      end
    end

    context 'when not authenticated' do
      it 'returns unauthorized' do
        delete "/api/v1/threads/#{thread.id}/posts/#{post_record.id}"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
