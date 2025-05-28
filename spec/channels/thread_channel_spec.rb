require 'rails_helper'

RSpec.describe ThreadChannel, type: :channel do
  it "successfully subscribes to a specific thread" do
    subscribe(id: 42)
    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_from("thread_42")
  end

  it "broadcasts to the threads stream" do
    expect {
      ActionCable.server.broadcast("threads", { foo: "bar" }, coder: ActiveSupport::JSON)
    }.to have_broadcasted_to("threads").with(foo: "bar")
  end
end
