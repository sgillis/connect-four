module.exports = {
    construct: construct
}

function availableSpot(x, y, pieces){
    // Return the lowest available position for this column
    // Keep in mind that 6 is the lowest position and 0 the highest
    var all_pieces = pieces[0].concat(pieces[1]);
    lowest = 6;
    for(piece in all_pieces){
        if(all_pieces[piece][0] === x){
            if(all_pieces[piece][1] <= lowest){
                lowest = all_pieces[piece][1] - 1;
            }
        }
    }
    return [x, lowest];
}

function fourConnected(pieces){
    // Check if there are four connected pieces
    for(piece in pieces){
        // Check to the right
        var x = pieces[piece][0];
        var y = pieces[piece][1];
        for(var i=1; i<4; i++){
            if(indexOfArr(pieces, [x+i, y]) == -1){
                break;
            }
            if(i == 3){
                // If we got here, we have a horizontal connect four
                return true;
            }
        }
        // Check down
        for(var i=1; i<4; i++){
            if(indexOfArr(pieces, [x, y+i]) == -1){
                break;
            }
            if(i == 3){
                return true;
            }
        }
        // Check diagonally
        for(var i=1; i<4; i++){
            if(indexOfArr(pieces, [x+i, y+i]) == -1){
                break;
            }
            if(i == 3){
                return true;
            }
        }
        // And the other diagonal
        for(var i=1; i<4; i++){
            if(indexOfArr(pieces, [x-i, y+i]) == -1){
                break;
            }
            if(i == 3){
                return true;
            }
        }
    }
    return false;
}

// Two functions for getting the index of a subarray
// From:
// http://codereview.stackexchange.com/questions/11070/snippet-of-custom-array-indexof-that-supports-nested-arrays
function indexOfArr(arr1, fnd) {
    for (var i = 0, len1 = arr1.length; i < len1; i++) {
        if (!(i in arr1)) {
            continue;
        }
        if (elementComparer(arr1[i], fnd)) {
            return i;
        }
    }
    return -1;
}

function elementComparer(fnd1, fnd2) {
    var type1 = typeof fnd1;
    var type2 = typeof fnd2;
    if (!((type1 == "number" && type2 == "number") && (fnd1 + "" == "NaN" && fnd2 + "" == "NaN"))) {
        if (type1 == "object" && fnd1 + "" != "null") {
            var len1 = fnd1.length;
            if (type2 == "object" && fnd2 + "" != "null") {
                var len2 = fnd2.length;
                if (len1 !== len2) {
                    return false;
                }
                for (var i = 0; i < len1; i++) {
                    if (!(i in fnd1 && i in fnd2)) {
                        if (i in fnd1 == i in fnd2) {
                            continue;
                        }
                        return false;
                    }
                    if (!elementComparer(fnd1[i], fnd2[i])) {
                        return false;
                    }
                }
            }
        } else {
            if (fnd1 !== fnd2) {
                return false;
            }
        }
    }
    return true;
}

// Construct function for calling any constructor with an array of arguments
// From:
function construct(constructor, args) {
    function F() {
        return constructor.apply(this, args);
    }
    F.prototype = constructor.prototype;
    return new F();
}
