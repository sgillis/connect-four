module.exports = {
    brain: function Brain(){
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
        // with the restrications that \sigma^0_d = p_{0, 1} and m^{h}_d =
        // p_{h+1,h} (where h is the number of neurons).
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
        this.input = [];
        this.output = [];
    },

    neuronlayer: function NeuronLayer(){
        // A layer of neurons
        this.neurons = [];

        this.update = function(){
            for(var i=0; i<neurons.length; i++){
                neurons[i].process_inputs();
            }
        }
    },

    neuron: function Neuron(mu_s, sigma_s, mu_d, sigma_d){
        // One neuron
        // net_s and net_d are calculated if the corresponding variables are
        // passed as arguments
        this.weights = [];
        this.mu_s = mu_s;
        this.sigma_s = sigma_s;
        this.mu_d = mu_d;
        this.sigma_d = sigma_d;

        this.process_inputs = function(inputs){
            var output = 0;
            for(var i=0; i<inputs.length; i++){
                output += inputs[i]*this.weights[i];
            }
            if(mu_s !== undefined && sigma_s !== undefined){
                output = Sigmoid(output, mu_s, sigma_s);
            }
            if(mu_d !== undefined && sigma_d !== undefined){
                output = Sigmoid(output, mu_d, sigma_d);
            }
            return output;
        }
    },

    genome: function Genome(){
        // Contains the weights for a neural network
        this.weights = [];

        var random_seed = function(nr_weights){
            for(var i=0; i<nr_weights; i++){
                this.weights.push(Math.random());
            }
        };
    }
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


