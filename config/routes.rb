Rails.application.routes.draw do
  # Web authentication routes
  devise_for :users, skip: [ :sessions, :registrations ]
  devise_scope :user do
    get "/users/sign_in", to: "devise/sessions#new", as: :new_user_session
    post "/users/sign_in", to: "devise/sessions#create", as: :user_session
    delete "/users/sign_out", to: "devise/sessions#destroy", as: :destroy_user_session
    get "/users/sign_up", to: "devise/registrations#new", as: :new_user_registration
    post "/users", to: "devise/registrations#create", as: :user_registration
  end

  namespace :api do
    namespace :v1 do
      # API authentication routes
      post "users/login", to: "sessions#create"
      delete "users/logout", to: "sessions#destroy"
      post "users/signup", to: "registrations#create"

      get "current_user", to: "users#current"

      resources :threads do
        resources :posts, only: [ :create, :update, :destroy ]
      end
    end
  end

  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  root "home#index"
end
