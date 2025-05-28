FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    sequence(:username) { |n| "user#{n}" }
    password { "password123" }
    password_confirmation { "password123" }

    trait :with_threads do
      after(:create) do |user|
        create_list(:forum_thread, 3, user: user)
      end
    end

    trait :with_posts do
      after(:create) do |user|
        thread = create(:forum_thread)
        create_list(:post, 2, user: user, forum_thread: thread)
      end
    end
  end
end
