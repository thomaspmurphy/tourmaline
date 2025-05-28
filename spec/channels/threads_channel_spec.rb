require 'rails_helper'

RSpec.describe ThreadsChannel, type: :channel do
  it "successfully subscribes" do
    subscribe
    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_from("threads")
  end
end
