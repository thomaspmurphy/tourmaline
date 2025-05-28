class Api::V1::RegistrationsController < Api::V1::BaseController
  skip_before_action :authenticate_user!

  def create
    user = User.new(user_params)

    if user.save
      token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
      render json: {
        id: user.id,
        email: user.email,
        username: user.username,
        token: token
      }, status: :created
    else
      render json: {
        errors: user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.require(:user).permit(:email, :password, :password_confirmation, :username)
  end
end
