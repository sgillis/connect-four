var utils = require('./utils.js')

module.exports = {
    Brain: Brain,
    NeuronLayer: NeuronLayer,
    Neuron: Neuron,
    Sigmoid: Sigmoid
}

function Brain(){
    // Will accept input and spit out output as calculated by the network
    //
    // The model for a neural network is based on 'Playing Tic-Tac-Toe Using
    // Genetic Neural Network with Double Transfer Function' by Sai Ho Ling and
    // Hak Keung Lam in Journal of Intelligent Learning Sytems and
    // Applications, 2011, 3, 37-44.
    //
    // A neuron is modeled by two functions. The first function accepts the
    // inputs to the neuron and is called net^j_s for the j-th neruon. The
    // inputs are called x_i and are multiplied with the weights v_{ij}.
    // net^j_s is defined by:
    //   
    //   net^j_s(\sum_{i=1}^{n_{in}} x_i v_{ij}) = exp( -( (\sum_{i=1}^{n_{in}}
    //   x_i v_{ij}) - m^j_s )^2 / (2 \sigma^j_s^2) ) -1 if \sum_{i=1}^{n_{in}}
    //   x_i v_{ij} < m^j_s otherwise 1 - exp( ... )
    //
    // The second function is called net^j_d and couples the output net^j_s
    // with with two other parameters: m^j_d and \sigma^j_d. The form of
    // net^j_d is the same as that of net^j_s, but the result of net^j_s takes
    // the place of the summation over the inputs. m^j_d and \sigma^j_d are
    // defined as follows:
    //
    //   m^j_d = p_{j+1, j} net^{j+1}_s
    //   \sigma^j_d = p_{j-1, j} net^{j-1}_s
    //
    // Thus in this model we have three layers of neurons, the input layer,
    // the hidden layer and the output layer. The input layer neurons transmit
    // all incoming signals to all neurons in the hidden layer. The hidden
    // layer neurons in turn submit their outputs to the output neuron layer,
    // where there are n_{out} output neurons. These combine the outputs from
    // the hidden neuron layer by the function net^l (l = 1, ..., n_{out}),
    // which is the same function as net^j_s and net^j_d so that the l-th
    // output signal is equal to
    //
    //   y_l = net^l( \sum_{j=1}^h z_j w_{jl} )

    // layers is a list, every number in the list is the amount of neurons in
    // that particular list
    this.layers = [];
    this.input = [];
    this.output = [];

    this.initialize = function(layers){
       this.layers = layers;
    }
}

function NeuronLayer(){
    // A layer of neurons
    this.neurons = [];
    this.inputs = [];
    this.outputs = [];
    this.feedback_weights = [];

    // neurons is a list, the length of the list is the amount of neurons
    // required, and the elements of the list are lists with the arguments
    // for the neuron, e.g:
    //   [ [ [1, 2, 3], 1.3, 4.2, 5.6, 3.1 ], ... ]
    //
    // feedback_weights is a list of two lists of numbers representing the
    // p_j's from the comment in Brain. The first list is a list of p_{i+1, i},
    // the second list is a list of p_{i, i+1}
    this.initialize = function(neurons, feedback_weights){
        for(var i=0; i<neurons.length; i++){
            this.neurons.push(utils.construct(Neuron, neurons[i]));
        }
        if(feedback_weights !== undefined){
            this.feedback_weights = feedback_weights;
        }
    }

    this.update = function(){
        this.outputs = [];
        if(this.feedback_weights.length > 0){
            var net_s = [];
            for(var i=0; i<this.neurons.length; i++){
                net_s[i] = this.neurons[i].process_inputs(this.inputs);
            }
            for(var i=0; i<this.neurons.length; i++){
                if(i == 0){
                    sigma_d = this.feedback_weights[1][0]*net_s[this.neurons.length-1];
                } else {
                    sigma_d = this.feedback_weights[1][i]*net_s[i-1];
                }
                if(i == this.neurons.length - 1){
                    mu_d = this.feedback_weights[0][i]*net_s[0];
                } else {
                    mu_d = this.feedback_weights[0][i]*net_s[i+1];
                }
                this.outputs[i] = Sigmoid(net_s[i], mu_d, sigma_d);
            }
        } else {
            for(var i=0; i<this.neurons.length; i++){
                this.outputs[i] = this.neurons[i].process_inputs(this.inputs);
            }
        }
    }
}

function Neuron(weights, mu_s, sigma_s){
    // One neuron
    // net_s and net_d are calculated if the corresponding variables are
    // passed as arguments
    this.weights = weights;
    this.mu_s = mu_s;
    this.sigma_s = sigma_s;

    // TODO fix mu_d and sigma_d functionality
    this.process_inputs = function(inputs, mu_d, sigma_d){
        var output = 0;
        for(var i=0; i<inputs.length; i++){
            output += inputs[i]*this.weights[i];
        }
        if(mu_s !== undefined && sigma_s !== undefined){
            output = Sigmoid(output, mu_s, sigma_s);
        }
        return output;
    }
}

function Genome(){
    // Contains the weights for a neural network
    this.weights = [];

    var random_seed = function(nr_weights){
        for(var i=0; i<nr_weights; i++){
            this.weights.push(Math.random());
        }
    };
}

function Sigmoid(x, m, s){
    // Calculates the sigmoid function
    //
    //   sigmoid(x, m, s) =
    //     exp( -(x-m)^2 / (2s^2) ) - 1   if x<m
    //     1 - exp( -(x-m)^2 / (2s^2) )   otherwise
    //
    exp = Math.exp( -Math.pow(x-m,2) / (2*Math.pow(s,2)) );
    if(x<m){
        return exp - 1;
    } else {
        return 1 - exp;
    }
}
