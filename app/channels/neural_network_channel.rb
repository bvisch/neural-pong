class NeuralNetworkChannel < ApplicationCable::Channel

  def train
    NeuralNetwork.train(@training_set)
    @training_set = []
    transmit(true)
  end

  def store(data)
    (@training_set ||= []) << data.symbolize_keys!
  end

  def move(data)
    transmit(data['ball']['y'] <=> data['paddle']['y'])
  end
end
