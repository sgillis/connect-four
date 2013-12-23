function Brain(){
    // Will accept input and spit out output as calculated by the network
    this.layers = [];
}

function NeuronLayer(){
    // A layer of neurons
    this.neurons = [];

    this.update = function(){
        for(int i=0; i<neurons.length; i++){
            neurons[i].process_inputs();
        }
    }
}

function Neuron(){
    // One neuron. Accepts inputs and fires if the threshold is reached
    this.weights = [];
    this.input = [];

    this.process_inputs = function(){
        var net_input = 0
        for(int i=0; i<input.length; i++){
            net_input += input[i]*weights[i];
        }
    }
}

function Genome(){
    // Contains the weights for a neural network
    this.weights = [];
}
