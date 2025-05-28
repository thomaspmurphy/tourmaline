FactoryBot.define do
  factory :forum_thread do
    title { Faker::Lorem.sentence(word_count: 3, supplemental: false, random_words_to_add: 2) }
    content { Faker::Lorem.paragraph(sentence_count: 3) }
    association :user

    trait :with_posts do
      after(:create) do |thread|
        create_list(:post, 3, forum_thread: thread)
      end
    end

    trait :recent do
      created_at { 1.hour.ago }
      updated_at { 1.hour.ago }
    end

    trait :old do
      created_at { 1.month.ago }
      updated_at { 1.month.ago }
    end
  end
end
