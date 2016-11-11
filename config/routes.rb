Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  root to: 'pong#index'

  post '/api/train', to: 'pong#train'
  post '/api/upload', to: 'pong#upload_training_data'
  get '/pong/hi', to: 'pong#hi'

  mount ActionCable.server => '/cable'
end
