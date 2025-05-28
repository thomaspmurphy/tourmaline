class Api::V1::SessionsController < Api::V1::BaseController
  skip_before_action :authenticate_user!

  def create
    user = User.find_by(email: params[:user][:email])

    if user&.valid_password?(params[:user][:password])
      token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
      render json: {
        id: user.id,
        email: user.email,
        username: user.username,
        token: token
      }, status: :ok
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  def destroy
    # JWT tokens are stateless, so we just return success
    # In a production app, we might want to implement a token blacklist
    head :ok
  end
end
