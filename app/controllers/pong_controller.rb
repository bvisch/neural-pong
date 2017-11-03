class PongController < ActionController::Base
  layout 'application'

  def index
  end

  def get_network
    @network = NeuralNetwork.get_network
    respond_to do |format|
        format.js
    end
  end

  def hi
    render json: { date: DateTime.now }
  end

end
