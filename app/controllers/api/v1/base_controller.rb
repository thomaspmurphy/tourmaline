class Api::V1::BaseController < ActionController::API
  before_action :authenticate_user!

  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from ActiveRecord::RecordInvalid, with: :record_invalid

  private

  def authenticate_user!
    token = request.headers["Authorization"]&.split(" ")&.last
    return render json: { error: "No token provided" }, status: :unauthorized unless token

    begin
      secret = Rails.application.credentials.devise_jwt_secret_key || Rails.application.secret_key_base
      decoded_token = JWT.decode(token, secret, true, { algorithm: "HS256" }).first
      @current_user = User.find(decoded_token["sub"])
    rescue JWT::DecodeError, ActiveRecord::RecordNotFound
      render json: { error: "Invalid token" }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end

  def not_found
    render json: { error: "Resource not found" }, status: :not_found
  end

  def record_invalid(exception)
    render json: { errors: exception.record.errors.full_messages }, status: :unprocessable_entity
  end
end
