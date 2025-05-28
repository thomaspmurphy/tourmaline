class HomeController < ApplicationController
  def index
    render :index, layout: "application"
  end
end
