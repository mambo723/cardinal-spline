/**
 * see https://github.com/epistemex/cardinal-spline-js/blob/master/src/curve_calc.js
 *
 * Calculates an array containing points representing a cardinal spline through given point array.
 * Points must be arranged as: [x1, y1, x2, y2, ..., xn, yn].
 *
 * @param {Array} points - point array
 * @param {Number} [tension=0.5] - tension. Typically between [0.0, 1.0] but can be exceeded
 * @param {Number} [numOfSeg=25] - number of segments between two points (line resolution)
 * @param {Boolean} [close=false] - Close the ends making the line continuous
 * @returns {Float32Array} - the spline points.
 */
module.exports = function cSpline(points, tension, numOfSeg, close) {
    // options or defaults
    tension = (typeof tension === 'number') ? tension : 0.5;
    numOfSeg = numOfSeg ? numOfSeg : 25;
    var pts, // for cloning point array
        i = 1,
        l = points.length,
        rPos = 0,
        rLen = (l - 2) * numOfSeg + 2 + (close ? 2 * numOfSeg : 0),
        res = new Float32Array(rLen),
        cache = new Float32Array((numOfSeg + 2) * 4),
        cachePtr = 4,
        st, st2, st3, st23, st32, parse;
    pts = points.slice(0);
    if (close) {
        pts.unshift(points[l - 1]); // insert end point as first point
        pts.unshift(points[l - 2]);
        pts.push(points[0], points[1]); // first point as last point
    } else {
        pts.unshift(points[1]); // copy 1. point and insert at beginning
        pts.unshift(points[0]);
        pts.push(points[l - 2], points[l - 1]); // duplicate end-points
    }
    // cache inner-loop calculations as they are based on t alone
    cache[0] = 1; // 1,0,0,0
    for (; i < numOfSeg; i++) {
        st = i / numOfSeg;
        st2 = st * st;
        st3 = st2 * st;
        st23 = st3 * 2;
        st32 = st2 * 3;
        cache[cachePtr++] = st23 - st32 + 1; // c1
        cache[cachePtr++] = st32 - st23; // c2
        cache[cachePtr++] = st3 - 2 * st2 + st; // c3
        cache[cachePtr++] = st3 - st2; // c4
    }
    cache[++cachePtr] = 1; // 0,1,0,0

    parse = function (pts, cache, l) {

        var i = 2;
        var t, pt1, pt2, pt3, pt4, t1x, t1y, t2x, t2y, c, c1, c2, c3, c4;

        for (i; i < l; i += 2) {
            pt1 = pts[i];
            pt2 = pts[i + 1];
            pt3 = pts[i + 2];
            pt4 = pts[i + 3];
            t1x = (pt3 - pts[i - 2]) * tension;
            t1y = (pt4 - pts[i - 1]) * tension;
            t2x = (pts[i + 4] - pt1) * tension;
            t2y = (pts[i + 5] - pt2) * tension;
            for (t = 0; t < numOfSeg; t++) {
                //t * 4;
                c = t << 2; //jshint ignore: line
                c1 = cache[c];
                c2 = cache[c + 1];
                c3 = cache[c + 2];
                c4 = cache[c + 3];

                res[rPos++] = c1 * pt1 + c2 * pt3 + c3 * t1x + c4 * t2x;
                res[rPos++] = c1 * pt2 + c2 * pt4 + c3 * t1y + c4 * t2y;
            }
        }
    };

    // calc. points
    parse(pts, cache, l);

    if (close) {
        //l = points.length;
        pts = [];
        pts.push(points[l - 4], points[l - 3], points[l - 2], points[l - 1]); // second last and last
        pts.push(points[0], points[1], points[2], points[3]); // first and second
        parse(pts, cache, 4);
    }
    // add last point
    l = close ? 0 : points.length - 2;
    res[rPos++] = points[l];
    res[rPos] = points[l + 1];

    return res;
};