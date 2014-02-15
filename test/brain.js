var chai = require('chai');
var chaistats = require('chai-stats');
var brain = require('../js/brain.js');
var utils = require('../js/utils.js');
var assert  = chai.assert;
chai.use(chaistats);

describe('Brain', function(){
    it('should create the required neuron layers', function(){
        var dna = {
            layers: [
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
            ]
        };
        var neuralnet = new brain.Brain();
        neuralnet.initialize(dna);
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
        var dna = {
            layers: [
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
            ]
        };
        var neuralnet = new brain.Brain();
        neuralnet.initialize(dna);
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
            var layers = [
                { nr_neurons: 4,
                  feedbacks: true,
                  max_weight: 5,
                  max_mu: 5,
                  max_sigma: 5
                },
                { nr_neurons: 10,
                  feedbacks: true,
                  max_weight: 5,
                  max_mu: 5,
                  max_sigma: 5
                }
            ];
            var nr_inputs = 3;
            var genome = new brain.Genome();
            genome.random_generation(nr_inputs, layers);
            assert.equal(genome.dna.layers.length, 2);
            assert.property(genome.dna.layers[0], 'neurons');
            assert.property(genome.dna.layers[0], 'feedback_weights');
            assert.equal(genome.dna.layers[0].neurons.length, 4);
            assert.equal(genome.dna.layers[1].neurons.length, 10);
            assert.property(genome.dna.layers[0].neurons[0], 'weights');
            assert.equal(genome.dna.layers[0].feedback_weights.mu_d_weights.length, 4);
            assert.equal(genome.dna.layers[1].neurons[0].weights.length, 4);
            assert.equal(genome.dna.layers[1].feedback_weights.mu_d_weights.length, 10);
        });

        it('should be able to add two genomes with the same dimensions', function(){
            var layers = [
                { nr_neurons: 4,
                  feedbacks: true,
                  max_weight: 5,
                  max_mu: 5,
                  max_sigma: 5
                },
                { nr_neurons: 10,
                  feedbacks: true,
                  max_weight: 5,
                  max_mu: 5,
                  max_sigma: 5
                }
            ];
            var nr_inputs = 3;
            var genome1 = new brain.Genome();
            var genome2 = new brain.Genome();
            genome1.random_generation(nr_inputs, layers);
            genome2.random_generation(nr_inputs, layers);
            result_genome = brain.add_genomes(genome1, genome2);
            assert.equal(
                genome1.dna.layers[0].neurons[0].weights[0] +
                genome2.dna.layers[0].neurons[0].weights[0],
                result_genome.dna.layers[0].neurons[0].weights[0])
            assert.equal(genome1.dna.layers.length,
                result_genome.dna.layers.length);
            assert.equal(genome1.dna.layers[0].neurons.length,
                result_genome.dna.layers[0].neurons.length);
            assert.equal(genome1.dna.layers[0].neurons[0].weights.length,
                result_genome.dna.layers[0].neurons[0].weights.length)
            assert.equal(genome1.dna.layers[0].feedback_weights.length,
                result_genome.dna.layers[0].feedback_weights.length);
        });

        it('should be able to multiply a genome with a constant factor', function(){
            var layers = [
                { nr_neurons: 4,
                  feedbacks: true,
                  max_weight: 5,
                  max_mu: 5,
                  max_sigma: 5
                },
                { nr_neurons: 10,
                  feedbacks: true,
                  max_weight: 5,
                  max_mu: 5,
                  max_sigma: 5
                }
            ];
            var nr_inputs = 3;
            var genome = new brain.Genome();
            var w = 0.3;
            genome.random_generation(nr_inputs, layers);
            result_genome = brain.multiply_genome(genome, w);
            assert.equal(genome.dna.layers[0].neurons[0].mu_s * w,
                result_genome.dna.layers[0].neurons[0].mu_s);
            assert.equal(genome.dna.layers.length,
                result_genome.dna.layers.length);
            assert.equal(genome.dna.layers[0].neurons.length,
                result_genome.dna.layers[0].neurons.length);
            assert.equal(genome.dna.layers[0].neurons[0].weights.length,
                result_genome.dna.layers[0].neurons[0].weights.length)
            assert.equal(genome.dna.layers[0].feedback_weights.length,
                result_genome.dna.layers[0].feedback_weights.length);
        });

        it('should be able to take the max of two genomes', function(){
             var layers = [
                { nr_neurons: 4,
                  feedbacks: true,
                  max_weight: 5,
                  max_mu: 5,
                  max_sigma: 5
                },
                { nr_neurons: 10,
                  feedbacks: true,
                  max_weight: 5,
                  max_mu: 5,
                  max_sigma: 5
                }
            ];
            var nr_inputs = 3;
            var genome1 = new brain.Genome();
            var genome2 = new brain.Genome();
            genome1.random_generation(nr_inputs, layers);
            genome2.random_generation(nr_inputs, layers);
            result_genome = brain.max_genome(genome1, genome2);
            assert.equal(
                Math.max(genome1.dna.layers[0].neurons[0].weights[0],
                    genome2.dna.layers[0].neurons[0].weights[0]),
                result_genome.dna.layers[0].neurons[0].weights[0])
            assert.equal(genome1.dna.layers.length,
                result_genome.dna.layers.length);
            assert.equal(genome1.dna.layers[0].neurons.length,
                result_genome.dna.layers[0].neurons.length);
            assert.equal(genome1.dna.layers[0].feedback_weights.length,
                result_genome.dna.layers[0].feedback_weights.length);
        });

        it('should be able to take the min of two genomes', function(){
             var layers = [
                { nr_neurons: 4,
                  feedbacks: true,
                  max_weight: 5,
                  max_mu: 5,
                  max_sigma: 5
                },
                { nr_neurons: 10,
                  feedbacks: true,
                  max_weight: 5,
                  max_mu: 5,
                  max_sigma: 5
                }
            ];
            var nr_inputs = 3;
            var genome1 = new brain.Genome();
            var genome2 = new brain.Genome();
            genome1.random_generation(nr_inputs, layers);
            genome2.random_generation(nr_inputs, layers);
            result_genome = brain.min_genome(genome1, genome2);
            assert.equal(
                Math.min(genome1.dna.layers[0].neurons[0].weights[0],
                    genome2.dna.layers[0].neurons[0].weights[0]),
                result_genome.dna.layers[0].neurons[0].weights[0])
            assert.equal(genome1.dna.layers.length,
                result_genome.dna.layers.length);
            assert.equal(genome1.dna.layers[0].neurons.length,
                result_genome.dna.layers[0].neurons.length);
            assert.equal(genome1.dna.layers[0].feedback_weights.length,
                result_genome.dna.layers[0].feedback_weights.length);
        });

        it('should be able to mate with another genome', function(){
            var layers = [
                { nr_neurons: 4,
                  feedbacks: true,
                  max_weight: 6.0,
                  max_mu: 4.0,
                  max_sigma: 10.0
                },
                { nr_neurons: 10,
                  feedbacks: true,
                  max_weight: 6.0,
                  max_mu: 4.0,
                  max_sigma: 10.0
                }
            ];
            var nr_inputs = 3;
            var w = 0.3;
            var g1 = new brain.Genome();
            var g2 = new brain.Genome();
            var gmax = new brain.Genome();
            var gmin = new brain.Genome();
            g1.random_generation(nr_inputs, layers);
            g2.random_generation(nr_inputs, layers);
            gmax.max_generation(nr_inputs, layers);
            gmin.min_generation(nr_inputs, layers);
            offspring = g1.mate(g2, gmax, gmin, w);
            assert.equal(g1.dna.layers[0].neurons[0].weights[0] / 2 +
                g2.dna.layers[0].neurons[0].weights[0] / 2,
                offspring.os1.dna.layers[0].neurons[0].weights[0]);
            assert.equal(gmax.dna.layers[0].neurons[0].weights[0] * (1-w) +
                Math.max(g1.dna.layers[0].neurons[0].weights[0], g2.dna.layers[0].neurons[0].weights[0]) * w,
                offspring.os2.dna.layers[0].neurons[0].weights[0]);
            assert.equal(gmin.dna.layers[0].neurons[0].weights[0] * (1-w) +
                Math.min(g1.dna.layers[0].neurons[0].weights[0], g2.dna.layers[0].neurons[0].weights[0]) * w,
                offspring.os3.dna.layers[0].neurons[0].weights[0]);
            assert.equal((gmax.dna.layers[0].neurons[0].weights[0] + gmin.dna.layers[0].neurons[0].weights[0]) * (1-w) +
                offspring.os1.dna.layers[0].neurons[0].weights[0] * w,
                offspring.os4.dna.layers[0].neurons[0].weights[0]);
        });

        it('should have a dnos generating function', function(){
             var layers = [
                { nr_neurons: 4,
                  feedbacks: true,
                  max_weight: 6.0,
                  max_mu: 4.0,
                  max_sigma: 10.0
                },
                { nr_neurons: 10,
                  feedbacks: true,
                  max_weight: 6.0,
                  max_mu: 4.0,
                  max_sigma: 10.0
                }
            ];
            var nr_inputs = 3;
            var g = new brain.Genome();
            var gmax = new brain.Genome();
            var gmin = new brain.Genome();
            g.random_generation(nr_inputs, layers);
            gmax.max_generation(nr_inputs, layers);
            gmin.min_generation(nr_inputs, layers);
            var dnos = g.dnos(gmax, gmin);
            assert.isTrue(gmin.dna.layers[0].neurons[0].weights[0] <=
                g.dna.layers[0].neurons[0].weights[0] + dnos.dna.layers[0].neurons[0].weights[0] <=
                gmax.dna.layers[0].neurons[0].weights[0])
            assert.isTrue(gmin.dna.layers[0].neurons[0].mu_s <=
                g.dna.layers[0].neurons[0].mu_s + dnos.dna.layers[0].neurons[0].mu_s <=
                gmax.dna.layers[0].neurons[0].mu_s)
            assert.isTrue(gmin.dna.layers[0].neurons[0].sigma_s <=
                g.dna.layers[0].neurons[0].sigma_s + dnos.dna.layers[0].neurons[0].sigma_s <=
                gmax.dna.layers[0].neurons[0].sigma_s)
            assert.isTrue(gmin.dna.layers[0].feedback_weights.mu_d_weights[0] <=
                g.dna.layers[0].feedback_weights.mu_d_weights[0] + dnos.dna.layers[0].feedback_weights.mu_d_weights[0] <=
                gmax.dna.layers[0].feedback_weights.mu_d_weights[0])
            assert.isTrue(gmin.dna.layers[0].feedback_weights.sigma_d_weights[0] <=
                g.dna.layers[0].feedback_weights.sigma_d_weights[0] + dnos.dna.layers[0].feedback_weights.sigma_d_weights[0] <=
                gmax.dna.layers[0].feedback_weights.sigma_d_weights[0])
        });
    });
});
