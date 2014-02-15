(function(exports){
    exports.Brain = Brain;
    exports.NeuronLayer = NeuronLayer;
    exports.Neuron = Neuron;
    exports.Genome = Genome;
    exports.add_genomes = add_genomes;
    exports.multiply_genome = multiply_genome;
    exports.max_genome = max_genome;
    exports.min_genome = min_genome;
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
    // Thus in this model we have thr.max_sigmalayers of neurons, the input layer,
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
    this.genome = [];

    // layers is a list of dicts where every list is of the form
    // { neurons: [
    //       { weights: [1, 2, 3],
    //         mu_s: 30,
    //         sigma_s: 3 },
    //       { weights: [2, 3, 4],
    //         mu_s: 60,
    //         sigma_s: 120 },
    //       ...
    //   ],
    //   feedback_weights: {
    //       mu_d_weights: [1, 2, 3, ...],
    //       sigma_d_weights: [1, 2, 3, ...]
    //   }
    // }
    // where neurons and feedback_weights are as defined by
    // NeuronLayer.initialize
    this.initialize = function(dna){
        this.genome = dna;
        for(var i=0; i<dna.layers.length; i++){
            var neuron_layer = new NeuronLayer();
            neuron_layer.initialize(
                dna.layers[i].neurons,
                dna.layers[i].feedback_weights);
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
    this.feedback_weights = undefined;

    // neurons is a list, the length of the list is the amount of neurons
    // required, and the elements of the list are descriptions of neurons in 
    // the form
    //
    //   { weights: [1, 2, 3],
    //     mu_s: 1.3,
    //     sigma_s: 4.2 }
    //
    // feedback_weights is a dict of two lists of numbers representing the
    // p_j's from the comment in Brain. The first list is a list of p_{i+1, i},
    // the second list is a list of p_{i, i+1}. Thus it should be of the form
    //
    //   { mu_d_weights: [1, 2, 3, ],
    //     sigma_d_weights: [1, 2, 3, ] }
    //
    this.initialize = function(neurons, feedback_weights){
        for(var i=0; i<neurons.length; i++){
            this.neurons.push(utils.construct(
                Neuron,
                [neurons[i].weights, neurons[i].mu_s, neurons[i].sigma_s]
            ));
        }
        if(feedback_weights !== undefined){
            this.feedback_weights = feedback_weights;
        }
    }

    this.update = function(){
        this.outputs = [];
        if(this.feedback_weights !== undefined){
            var net_s = [];
            for(var i=0; i<this.neurons.length; i++){
                net_s[i] = this.neurons[i].process_inputs(this.inputs);
            }
            for(var i=0; i<this.neurons.length; i++){
                if(i == 0){
                    sigma_d = this.feedback_weights.sigma_d_weights[0]*net_s[this.neurons.length-1];
                } else {
                    sigma_d = this.feedback_weights.sigma_d_weights[i]*net_s[i-1];
                }
                if(i == this.neurons.length - 1){
                    mu_d = this.feedback_weights.mu_d_weights[i]*net_s[0];
                } else {
                    mu_d = this.feedback_weights.mu_d_weights[i]*net_s[i+1];
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

    this.process_inputs = function(inputs){
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
    this.dna = {
        layers: []
    }

    // Create a random brain configuration based on the layers argument.
    // layers is a list of dicts. Every dict represents a single neuronlayer.
    // The dicts should have the form:
    //   { nr_neurons: 4,
    //     feedbacks: true,
    //     max_weight: 5.0,
    //     max_mu: 5.0,
    //     max_sigma: 5.0 }
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
            for(var neuron=0; neuron<layers[i].nr_neurons; neuron++){
                // Create weights
                var weight_dna = [];
                if(i == 0){
                    var nr_weights = nr_inputs;
                } else {
                    var nr_weights = layers[i-1].nr_neurons;
                }
                for(var weight=0; weight<nr_weights; weight++){
                    weight_dna.push(Math.random()*2*layers[i].max_weight -
                        layers[i].max_weight);
                }
                // Create mu_s
                var mu_dna = Math.random()*2*layers[i].max_mu - layers[i].max_mu;
                // Create sigma_s
                var sigma_dna = Math.random()*2*layers[i].max_sigma - layers[i].max_sigma;
                var neuron_dna = { weights: weight_dna,
                                   mu_s: mu_dna,
                                   sigma_s: sigma_dna };
                neuronlayer_dna.push(neuron_dna);
            }
            if(layers[i].feedbacks){
                var mud_dna = [];
                var sigmad_dna = [];
                for(var j=0; j<layers[i].nr_neurons; j++){
                    mud_dna.push(Math.random()*2*layers[i].max_mu - layers[i].max_mu);
                    sigmad_dna.push(Math.random()*2*layers[i].max_sigma - layers[i].max_sigma);
                }
                var feedback_dna = {
                    mu_d_weights: mud_dna,
                    sigma_d_weights: sigmad_dna
                };
            } else {
                var feedback_dna = undefined
            }
            brain_dna.push({
                neurons: neuronlayer_dna,
                feedback_weights: feedback_dna });
        }
        this.dna.layers = brain_dna;
    };

    // Create a genome with the max values for all weights. The input is the
    // same as for random_generation
    this.max_generation = function(nr_inputs, layers){
        var brain_dna = [];
        for(var i=0; i<layers.length; i++){
            var neuronlayer_dna = [];
            for(var neuron=0; neuron<layers[i].nr_neurons; neuron++){
                // Create weights
                var weight_dna = [];
                if(i == 0){
                    var nr_weights = nr_inputs;
                } else {
                    var nr_weights = layers[i-1].nr_neurons;
                }
                for(var weight=0; weight<nr_weights; weight++){
                    weight_dna.push(layers[i].max_weight);
                }
                // Create mu_s
                var mu_dna = layers[i].max_mu;
                // Create sigma_s
                var sigma_dna = layers[i].max_sigma;
                var neuron_dna = { weights: weight_dna,
                                   mu_s: mu_dna,
                                   sigma_s: sigma_dna };
                neuronlayer_dna.push(neuron_dna);
            }
            if(layers[i].feedbacks){
                var mud_dna = [];
                var sigmad_dna = [];
                for(var j=0; j<layers[i].nr_neurons; j++){
                    mud_dna.push(layers[i].max_mu);
                    sigmad_dna.push(layers[i].max_sigma);
                }
                var feedback_dna = {
                    mu_d_weights: mud_dna,
                    sigma_d_weights: sigmad_dna
                };
            } else {
                var feedback_dna = undefined
            }
            brain_dna.push({
                neurons: neuronlayer_dna,
                feedback_weights: feedback_dna });
        }
        this.dna.layers = brain_dna;
    }

    // Create a genome with the min values for all weights. The input is the
    // same as for random_generation
    this.min_generation = function(nr_inputs, layers){
        var brain_dna = [];
        for(var i=0; i<layers.length; i++){
            var neuronlayer_dna = [];
            for(var neuron=0; neuron<layers[i].nr_neurons; neuron++){
                // Create weights
                var weight_dna = [];
                if(i == 0){
                    var nr_weights = nr_inputs;
                } else {
                    var nr_weights = layers[i-1].nr_neurons;
                }
                for(var weight=0; weight<nr_weights; weight++){
                    weight_dna.push(-layers[i].max_weight);
                }
                // Create mu_s
                var mu_dna = -layers[i].max_mu;
                // Create sigma_s
                var sigma_dna = -layers[i].max_sigma;
                var neuron_dna = { weights: weight_dna,
                                   mu_s: mu_dna,
                                   sigma_s: sigma_dna };
                neuronlayer_dna.push(neuron_dna);
            }
            if(layers[i].feedbacks){
                var mud_dna = [];
                var sigmad_dna = [];
                for(var j=0; j<layers[i].nr_neurons; j++){
                    mud_dna.push(-layers[i].max_mu);
                    sigmad_dna.push(-layers[i].max_sigma);
                }
                var feedback_dna = {
                    mu_d_weights: mud_dna,
                    sigma_d_weights: sigmad_dna
                };
            } else {
                var feedback_dna = undefined
            }
            brain_dna.push({
                neurons: neuronlayer_dna,
                feedback_weights: feedback_dna });
        }
        this.dna.layers = brain_dna;
    }

    // Compute offspring of two genomes p_1 and p_2. This is done by first
    // calculating four different crossover genomes from the two original
    // genomes as follows:
    //
    //   os_1 = (p_1 + p_2) / 2
    //   os_2 = p_max * (1-w) + max(p_1, p_2)*w
    //   os_3 = p_min * (1-w) + min(p_1, p_2)*w
    //   os_4 = (p_max + p_min) * (1-w) / 2 + os_1 * w
    //
    // where p_max is a genome with all the maximum values for the parameters,
    // p_min is a genome with all the minimum values for the parameters.
    // max(p_1, p_2) is a genome where every value is the largest of the
    // corresponding value in either p_1 or p_2. For example
    //
    //   max([1, 2, -3], [5, -3, 1]) = [5, 2, 1]
    //   min([1, 2, -3], [5, -3, 1]) = [1, -3, -3]
    //
    // w is a predefined value with w in [0, 1]
    //
    // Once we calculated the crossover offspring, we generate mutations of
    // the offspring. For every crossover offspring we generate three mutations
    //
    //   nos_i = os + b_i * dnos
    //
    // where i in [1, 2, 3] and dnos are random numbers that satisfy
    //
    //   p_min =< os + dnos =< p_max
    //
    // b_1 is an all zero array, except for 1 element that is equal to 1. b_2
    // contains all zeros and ones that are distributed randomly. b_3 is an
    // array containing all ones.
    //
    // This will give us 12 new genomes.
    this.mate = function(p2){
    }
}


// Add two genomes and return the result as a new genome
function add_genomes(p1, p2){
    var result = new Genome();
    for(var i=0; i<p1.dna.layers.length; i++){
        result.dna.layers[i] = {
            feedback_weights: undefined,
            neurons: []
        };
        for(var neuron=0; neuron<p1.dna.layers[i].neurons.length; neuron++){
            var new_neuron = {};
            new_neuron.mu_s = p1.dna.layers[i].neurons[neuron].mu_s + p2.dna.layers[i].neurons[neuron].mu_s;
            new_neuron.sigma_s = p1.dna.layers[i].neurons[neuron].sigma_s + p2.dna.layers[i].neurons[neuron].sigma_s;
            new_neuron.weights = [];
            for(var j=0; j<p1.dna.layers[i].neurons[neuron].weights.length; j++){
                new_neuron.weights[j] = p1.dna.layers[i].neurons[neuron].weights[j] + p2.dna.layers[i].neurons[neuron].weights[j];
            }
            result.dna.layers[i].neurons[neuron] = new_neuron;
        }
        if(p1.dna.layers[i].feedback_weights != undefined){
            result.dna.layers[i].feedback_weights = {
                mu_d_weights: [],
                sigma_d_weights: []
            };
            for(var j=0; j<p1.dna.layers[i].feedback_weights.mu_d_weights.length; j++){
                result.dna.layers[i].feedback_weights.mu_d_weights[j] = p1.dna.layers[i].feedback_weights.mu_d_weights[j] + p2.dna.layers[i].feedback_weights.mu_d_weights[j];
                result.dna.layers[i].feedback_weights.sigma_d_weights[j] = p1.dna.layers[i].feedback_weights.sigma_d_weights[j] + p2.dna.layers[i].feedback_weights.sigma_d_weights[j];
            }
        }
    }
    return result;
}


// Multiply all weights in a genome p with a constant factor w. Return the
// result in a new genome
function multiply_genome(p, w){
    var result = new Genome();
    for(var i=0; i<p.dna.layers.length; i++){
        result.dna.layers[i] = {
            feedback_weights: undefined,
            neurons: []
        };
        for(var neuron=0; neuron<p.dna.layers[i].neurons.length; neuron++){
            var new_neuron = {};
            new_neuron.mu_s = p.dna.layers[i].neurons[neuron].mu_s * w;
            new_neuron.sigma_s = p.dna.layers[i].neurons[neuron].sigma_s * w;
            new_neuron.weights = [];
            for(var j=0; j<p.dna.layers[i].neurons[neuron].weights.length; j++){
                new_neuron.weights[j] = p.dna.layers[i].neurons[neuron].weights[j] * w;
            }
            result.dna.layers[i].neurons[neuron] = new_neuron;
        }
        if(p.dna.layers[i].feedback_weights != undefined){
            result.dna.layers[i].feedback_weights = {
                mu_d_weights: [],
                sigma_d_weights: []
            };
            for(var j=0; j<p.dna.layers[i].feedback_weights.mu_d_weights.length; j++){
                result.dna.layers[i].feedback_weights.mu_d_weights[j] = p.dna.layers[i].feedback_weights.mu_d_weights[j] * w;
                result.dna.layers[i].feedback_weights.sigma_d_weights[j] = p.dna.layers[i].feedback_weights.sigma_d_weights[j] * w;
            }
        }
    }
    return result;
}


// max(p_1, p_2) returns a genome with the max value in p_1 or p_2 for every
// weight. E.g.:
//
//   max([1, 5, -3], [2, -1, 6]) = [2, 5, 6]
function max_genome(p1, p2){
    var result = new Genome();
    for(var i=0; i<p1.dna.layers.length; i++){
        result.dna.layers[i] = {
            feedback_weights: undefined,
            neurons: []
        };
        for(var neuron=0; neuron<p1.dna.layers[i].neurons.length; neuron++){
            var new_neuron = {};
            new_neuron.mu_s = Math.max(p1.dna.layers[i].neurons[neuron].mu_s, p2.dna.layers[i].neurons[neuron].mu_s);
            new_neuron.sigma_s = Math.max(p1.dna.layers[i].neurons[neuron].sigma_s, p2.dna.layers[i].neurons[neuron].sigma_s);
            new_neuron.weights = [];
            for(var j=0; j<p1.dna.layers[i].neurons[neuron].weights.length; j++){
                new_neuron.weights[j] = Math.max(p1.dna.layers[i].neurons[neuron].weights[j], p2.dna.layers[i].neurons[neuron].weights[j]);
            }
            result.dna.layers[i].neurons[neuron] = new_neuron;
        }
        if(p1.dna.layers[i].feedback_weights != undefined){
            result.dna.layers[i].feedback_weights = {
                mu_d_weights: [],
                sigma_d_weights: []
            };
            for(var j=0; j<p1.dna.layers[i].feedback_weights.mu_d_weights.length; j++){
                result.dna.layers[i].feedback_weights.mu_d_weights[j] = Math.max(p1.dna.layers[i].feedback_weights.mu_d_weights[j], p2.dna.layers[i].feedback_weights.mu_d_weights[j]);
                result.dna.layers[i].feedback_weights.sigma_d_weights[j] = Math.max(p1.dna.layers[i].feedback_weights.sigma_d_weights[j], p2.dna.layers[i].feedback_weights.sigma_d_weights[j]);
            }
        }
    }
    return result;
}


// min(p_1, p_2) returns a genome with the max value in p_1 or p_2 for every
// weight. E.g.:
//
//   max([1, 5, -3], [2, -1, 6]) = [1, -1, -3]
function min_genome(p1, p2){
    var result = new Genome();
    for(var i=0; i<p1.dna.layers.length; i++){
        result.dna.layers[i] = {
            feedback_weights: undefined,
            neurons: []
        };
        for(var neuron=0; neuron<p1.dna.layers[i].neurons.length; neuron++){
            var new_neuron = {};
            new_neuron.mu_s = Math.min(p1.dna.layers[i].neurons[neuron].mu_s, p2.dna.layers[i].neurons[neuron].mu_s);
            new_neuron.sigma_s = Math.min(p1.dna.layers[i].neurons[neuron].sigma_s, p2.dna.layers[i].neurons[neuron].sigma_s);
            new_neuron.weights = [];
            for(var j=0; j<p1.dna.layers[i].neurons[neuron].weights.length; j++){
                new_neuron.weights[j] = Math.min(p1.dna.layers[i].neurons[neuron].weights[j], p2.dna.layers[i].neurons[neuron].weights[j]);
            }
            result.dna.layers[i].neurons[neuron] = new_neuron;
        }
        if(p1.dna.layers[i].feedback_weights != undefined){
            result.dna.layers[i].feedback_weights = {
                mu_d_weights: [],
                sigma_d_weights: []
            };
            for(var j=0; j<p1.dna.layers[i].feedback_weights.mu_d_weights.length; j++){
                result.dna.layers[i].feedback_weights.mu_d_weights[j] = Math.min(p1.dna.layers[i].feedback_weights.mu_d_weights[j], p2.dna.layers[i].feedback_weights.mu_d_weights[j]);
                result.dna.layers[i].feedback_weights.sigma_d_weights[j] = Math.min(p1.dna.layers[i].feedback_weights.sigma_d_weights[j], p2.dna.layers[i].feedback_weights.sigma_d_weights[j]);
            }
        }
    }
    return result;
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
