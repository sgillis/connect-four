var chai = require('chai');
var chaistats = require('chai-stats');
var brain = require('../js/brain.js');
var utils = require('../js/utils.js');
var assert  = chai.assert;
chai.use(chaistats);

describe('Brain', function(){
    it('should create the required neuron layers', function(){
        var layers = [
            {
                neurons: [
                    { weights: [1, 2, 3],
                      mu_s: 30,
                      sigma_s: 3 },
                    { weights: [2, 3, 4],
                      mu_s: 60,
                      sigma_s: 6 },
                    { weights: [3, 4, 5],
                      mu_s: 90,
                      sigma_s: 5 }
                ],
                feedback_weights: undefined
            },
            {
                neurons: [
                    { weights: [1, 2, 3],
                      mu_s: 30,
                      sigma_s: 3 },
                    { weights: [2, 3, 4],
                      mu_s: 60,
                      sigma_s: 6 },
                    { weights: [3, 4, 5],
                      mu_s: 90,
                      sigma_s: 5 }
                ],
                feedback_weights: { mu_d_weights: [5.2, 1.2, 7.3],
                  sigma_d_weights: [6.5, 4.3, 1] }
            },
        ];
        var neuralnet = new brain.Brain();
        neuralnet.initialize(layers);
        assert.equal(neuralnet.layers.length, 2);
        assert.equal(neuralnet.layers[0].feedback_weights, undefined);
        assert.deepEqual(neuralnet.layers[1].feedback_weights,
            { mu_d_weights: [5.2, 1.2, 7.3],
              sigma_d_weights: [6.5, 4.3, 1] }
        );
        assert.deepEqual(neuralnet.layers[0].neurons[1].weights, [2, 3, 4]);
        assert.equal(neuralnet.layers[0].neurons[1].mu_s, 60);
    });

    it('should properly process input', function(){
         var layers = [
            {
                neurons: [
                    { weights: [1, 2, 3],
                      mu_s: 15,
                      sigma_s: 3 },
                    { weights: [2, 3, 4],
                      mu_s: 30,
                      sigma_s: 6 },
                    { weights: [3, 4, 5],
                      mu_s: 10,
                      sigma_s: 5 }
                ],
                feedback_weights: undefined
            },
            {
                neurons: [
                    { weights: [1, 2, 3],
                      mu_s: 0.2,
                      sigma_s: 3 },
                    { weights: [2, 3, 4],
                      mu_s: -0.1,
                      sigma_s: 0.2 },
                    { weights: [3, 4, 5],
                      mu_s: -0.8,
                      sigma_s: 0.8 },
                    { weights: [5, 6, 7],
                      mu_s: -0.3,
                      sigma_s: 5 }
                ],
                feedback_weights: { 
                    mu_d_weights: [5.2, 1.2, 7.3, 1.2],
                    sigma_d_weights: [6.5, 4.3, 1, 2] }
            }
        ];
        var neuralnet = new brain.Brain();
        neuralnet.initialize(layers);
        neuralnet.process([1, 2, 3]);
        assert.deepEqual(neuralnet.output, [
            -0.9999999998987087,
            -0.14637036116268354,
            0.010816900137249008,
            0.00004977221803847964
        ]);
    });

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
            var neuron_arguments = [
                { weights: [1], mu_s: 1.1, sigma_s: 2.2},
                { weights: [2], mu_s: 4.3, sigma_s: 4.5}
            ];
            var neuron_layer = new brain.NeuronLayer();
            neuron_layer.initialize(neuron_arguments);
            assert.equal(neuron_layer.neurons.length, 2);
            for(var i=0; i<neuron_layer.neurons.length; i++){
                assert.equal(neuron_layer.neurons[i].mu_s, neuron_arguments[i].mu_s);
                assert.equal(neuron_layer.neurons[i].sigma_s, neuron_arguments[i].sigma_s);
            }
        });

        it('should correctly process input to output', function(){
            var neuron_arguments = [
                { weights: [1, 2, 3], mu_s: 30, sigma_s: 3},
                { weights: [2, 3, 4], mu_s: 60, sigma_s: 6},
            ];
            var neuron_layer = new brain.NeuronLayer();
            neuron_layer.initialize(neuron_arguments);
            neuron_layer.inputs = [5, 6, 7];
            neuron_layer.update();
            assert.deepAlmostEqual(neuron_layer.outputs, [0.9714344992154497, -0.1992625970831], 5);
        });

        it('should use dynamic sigmoid function if feedback weights are given', function(){
            var neuron_arguments = [
                { weights: [1, 2, 3], mu_s: 30, sigma_s: 3},
                { weights: [2, 3, 4], mu_s: 60, sigma_s: 6},
                { weights: [3, 4, 5], mu_s: 90, sigma_s: 5},
            ];
            var feedback_weights = {
                mu_d_weights: [5.2, 1.2, 7.3],
                sigma_d_weights: [6.5, 4.3, 1]
            };
            var neuron_layer = new brain.NeuronLayer();
            neuron_layer.initialize(neuron_arguments, feedback_weights);
            neuron_layer.inputs = [5, 6, 7];
            neuron_layer.update();
            assert.deepAlmostEqual(neuron_layer.outputs, [0.0471263465776689, 0.027891476129542903, -1], 5);
        });
    });

    describe('Genome', function(){
        it('should randomly generate correct brain dna', function(){
            var layers = [ [4, true, 5, 5, 5], [10, true, 5, 5, 5] ];
            var nr_inputs = 3;
            var genome = new brain.Genome();
            genome.random_generation(nr_inputs, layers);
            assert.equal(genome.weights.length, 2);
            assert.property(genome.weights[0], 'neurons');
            assert.property(genome.weights[0], 'feedback_weights');
            assert.equal(genome.weights[0].neurons.length, 4);
            assert.equal(genome.weights[1].neurons.length, 10);
            assert.property(genome.weights[0].neurons[0], 'weights');
            assert.equal(genome.weights[0].feedback_weights.mu_d_weights.length, 4);
            assert.equal(genome.weights[1].neurons[0].weights.length, 4);
            assert.equal(genome.weights[1].feedback_weights.mu_d_weights.length, 10);
        });
    });
});
