(function(exports){
    exports.Brain = Brain;
    exports.NeuronLayer = NeuronLayer;
    exports.Neuron = Neuron;
    exports.Genome = Genome;
    exports.Sigmoid = Sigmoid;
})(typeof exports === 'undefined'? this['brain']={} : exports);

if(typeof require !== 'undefined'){
    var utils = require('./utils.js');
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
    //

    this.layers = [];
    this.output = [];

    // layers is a list of lists where every list is of the form
    // [ neurons, feedback_weights ]
    // where neurons and feedback_weights are as defined by
    // NeuronLayer.initialize
    this.initialize = function(layers){
        for(var i=0; i<layers.length; i++){
            var neuron_layer = new NeuronLayer();
            neuron_layer.initialize(layers[i][0], layers[i][1]);
            this.layers.push(neuron_layer);
        }
    };

    this.process = function(signals){
        var input = signals;
        for(var i=0; i<this.layers.length; i++){
            this.layers[i].inputs = input;
            this.layers[i].update();
            input = this.layers[i].outputs;
        }
        this.output = this.layers[this.layers.length - 1].outputs;
    };
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
    //   [ [ [1, 2, 3], 1.3, 4.2 ], ... ]
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
    // Contains the weights for a brain
    this.weights = [];

    // Create a random brain configuration based on the layers argument.
    // layers is a list of lists. Every list represents a single neuronlayer.
    // The lists should have the form:
    //   [ nr_neurons, feedbacks, max_weight, max_mu, max_sigma ]
    // where nr_neurons is the amount of neurons in the layer, and feedbacks
    // is a boolean to indicate whether or not there should be feedback weights
    // in the layer.
    // nr_inputs is the number of inputs the brain should be able to accept.
    //
    // max_weight, max_mu and max_sigma are maxima on the generated values.
    // All values will be in the interval [-max, max]
    this.random_generation = function(nr_inputs, layers){
        var brain_dna = [];
        for(var i=0; i<layers.length; i++){
            var neuronlayer_dna = [];
            for(var neuron=0; neuron<layers[i][0]; neuron++){
                // Create weights
                var weight_dna = [];
                if(i == 0){
                    var nr_weights = nr_inputs;
                } else {
                    var nr_weights = layers[i-1][0];
                }
                for(var weight=0; weight<nr_weights; weight++){
                    weight_dna.push(Math.random()*2*layers[i][2] - layers[i][2]);
                }
                // Create mu_s
                var mu_dna = Math.random()*2*layers[i][3] - layers[i][3];
                // Create sigma_s
                var sigma_dna = Math.random()*2*layers[i][4] - layers[i][4];
                var neuron_dna = [weight_dna, mu_dna, sigma_dna];
                neuronlayer_dna.push(neuron_dna);
            }
            if(layers[i][1]){
                var mud_dna = [];
                var sigmad_dna = [];
                for(var j=0; j<layers[i][0]; j++){
                    mud_dna.push(Math.random()*2*layers[i][3] - layers[i][3]);
                    sigmad_dna.push(Math.random()*2*layers[i][4] - layers[i][4]);
                }
                var feedback_dna = [ mud_dna, sigmad_dna ];
            } else {
                var feedback_dna = undefined
            }
            brain_dna.push([ neuronlayer_dna, feedback_dna ]);
        }
        this.weights = brain_dna;
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
