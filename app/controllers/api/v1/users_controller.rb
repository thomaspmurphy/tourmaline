class Api::V1::UsersController < Api::V1::BaseController
  def current
    render json: {
      id: current_user.id,
      username: current_user.username,
      email: current_user.email
    }
  end
end
