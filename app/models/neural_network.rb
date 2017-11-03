require 'singleton'

class NeuralNetwork
  class TrainingData
    include Mongoid::Document
    include Mongoid::Timestamps
    store_in collection: "training_data"
    field :inputs, type: Array
    field :output, type: Integer
    # index({ data_point: 1 }, { unique: true })
  end

  class Network
    include Mongoid::Document
    include Mongoid::Timestamps
    store_in collection: "network"
    field :hidden_weights, type: Array
    field :hidden_bias, type: Array
    field :output_weights, type: Array
    field :output_bias, type: Array
    # index({ network_version: 1 }, { unique: true })
  end

  private_class_method :new

  @@instance = nil
  def self.instance(options = {})
    @@instance ||= new(options)
  end

  def initialize(options = {})
  end

  # def store(data)
  #   TrainingData.collection.insert_one(data)
  # end

  def self.train(data)
    TrainingData.collection.insert_many(data)
    system("python app/models/tf_network.py")
  end

  def self.get_network
    Network.order_by([:_id, :desc]).first
  end

end
