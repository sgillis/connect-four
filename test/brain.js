var chai = require('chai');
var brain = require('../js/brain.js');
var assert  = chai.assert;

describe('Brain', function(){
    describe('Neuron', function(){
        it('should multiply weights and inputs and return the sum when no arguments are passed', function(){
            n = new brain.neuron();
            n.weights = [1, 2, 3];
            assert.equal(n.process_inputs([1, 2, 3]), 14);
        });

        it('should apply one sigmoid function when two arguments are passed', function(){
            n = new brain.neuron(2.14, 5.36);
            n.weights = [1, 2, 3];
            assert.equal(n.process_inputs([1, 2, 3]), 0.913532868702284);
        });

        it('should apply one sigmoid function when two arguments are passed', function(){
            n = new brain.neuron(2.14, 5.36, 3.42, 7.67);
            n.weights = [1, 2, 3];
            assert.equal(n.process_inputs([1, 2, 3]), -0.051994839890442734);
        });
    })
});
