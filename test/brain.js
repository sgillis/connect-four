var chai = require('chai');
var brain = require('../js/brain.js');
var utils = require('../js/utils.js');
var assert  = chai.assert;

describe('Brain', function(){
    describe('Neuron', function(){
        it('should multiply weights and inputs and return the sum when no arguments are passed', function(){
            n = new brain.Neuron([1, 2, 3]);
            assert.equal(n.process_inputs([1, 2, 3]), 14);
        });

        it('should apply one sigmoid function when two arguments are passed', function(){
            n = new brain.Neuron([1, 2, 3], 2.14, 5.36);
            assert.equal(n.process_inputs([1, 2, 3]), 0.913532868702284);
        });
    });

    describe('NeuronLayer', function(){
        it('should create 5 neurons with no arguments', function(){
            var neuron_arguments = [[], [], [], [], []];
            var neuron_layer = new brain.NeuronLayer();
            neuron_layer.initialize(neuron_arguments);
            assert.equal(neuron_layer.neurons.length, 5);
            for(var i=0; i<neuron_layer.neurons.length; i++){
                assert.equal(neuron_layer.neurons[i].mu_s, undefined);
                assert.equal(neuron_layer.neurons[i].sigma_s, undefined);
            }
        });

        it('should create 2 neurons with all mus and sigmas set', function(){
            var neuron_arguments = [[[1], 1.1, 2.2], [[2], 4.3, 4.5]];
            var neuron_layer = new brain.NeuronLayer();
            neuron_layer.initialize(neuron_arguments);
            assert.equal(neuron_layer.neurons.length, 2);
            for(var i=0; i<neuron_layer.neurons.length; i++){
                assert.equal(neuron_layer.neurons[i].mu_s, neuron_arguments[i][1]);
                assert.equal(neuron_layer.neurons[i].sigma_s, neuron_arguments[i][2]);
            }
        });

        it('should correctly process input to output', function(){
            var neuron_arguments = [ [ [1, 2, 3], 30, 3 ], [ [2, 3, 4], 60, 6 ] ];
            var neuron_layer = new brain.NeuronLayer();
            neuron_layer.initialize(neuron_arguments);
            neuron_layer.inputs = [5, 6, 7];
            neuron_layer.update();
            assert.deepEqual(neuron_layer.outputs, [0.9714344992154497, -0.19926259708319183]);
        });

        it('should use dynamic sigmoid function if feedback weights are given', function(){
            var neuron_arguments = [ [ [1, 2, 3], 30, 3 ], [ [2, 3, 4], 60, 6 ], [ [3, 4, 5], 90, 5 ] ];
            var feedback_weights = [ [5.2, 1.2, 7.3], [6.5, 4.3, 1] ];
            var neuron_layer = new brain.NeuronLayer();
            neuron_layer.initialize(neuron_arguments, feedback_weights);
            neuron_layer.inputs = [5, 6, 7];
            neuron_layer.update();
            assert.deepEqual(neuron_layer.outputs, [0.0471263465776689, 0.027891476129542903, -1]);
        });
    });
});
