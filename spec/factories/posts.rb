FactoryBot.define do
  factory :post do
    content { Faker::Lorem.paragraph(sentence_count: 2) }
    association :user
    association :forum_thread

    trait :long_content do
      content { Faker::Lorem.paragraph(sentence_count: 10) }
    end

    trait :short_content do
      content { Faker::Lorem.sentence }
    end

    trait :recent do
      created_at { 30.minutes.ago }
      updated_at { 30.minutes.ago }
    end
  end
end
