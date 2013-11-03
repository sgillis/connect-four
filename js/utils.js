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
