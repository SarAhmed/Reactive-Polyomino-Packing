/**
* Acknowledgement: 
* - This code is a modified version of the original source of the following copyright and license:
*   ```
*   Copyright (c) 2013,2014 Institute of Mathematics and Computer Science, University of Latvia (IMCS UL). 
*
*   This file is part of layoutengine
*
*   You can redistribute it and/or modify it under the terms of the GNU General Public License 
*   as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
*
*   You should have received a copy of the GNU General Public License along with layoutengine. If not, see http://www.gnu.org/licenses/.
*   ```
*
* - The source code was originally written in Java and then transpiled into Javascript with the help of JSweet 3.0.0 - http://www.jsweet.org.
*/

import { SHAPES } from "./utils/shapes.js"
import { Miscellaneous } from "./utils/miscellaneous.js"

/**
 * This class defines a Polyomino.
 * @class
 */
var Polyomino = /** @class */ (function () {
    Polyomino.NEXT_POLYOMINO_ID = 1;

    /**
     * @param {array} originalShape A two-dimensional array holds the ORIGINAL shape of the polyomino before applying the zooming units and the the orientation.
     * @param {number} zoomingUnits The current zooming value applied.
     * @param {number} orientation The orientation of the polyomino. Orientation attribute holds a value from 0 to 3 inclusive.
     * 0->UP, 1->RIGHT (one clockwise rotation), 2->DOWN (two clockwise rotations), 3->LEFT (three clockwise rotations)
     */
    function Polyomino(originalShape, zoomingUnits = 0, orientation = 0) {
        this.minX = Infinity;
        this.maxX = -Infinity;
        this.minY = Infinity;
        this.maxY = -Infinity;
        this.spacing = 2; // Controls the margins between the polyominoes.

        this.id = Polyomino.NEXT_POLYOMINO_ID++;
        this.originalShape = originalShape;
        this.zoomingUnits = zoomingUnits;
        this.orientation = orientation;

        this.shape = PolyominoPacking.prototype.scaleAndOrientShape(
            this.originalShape,
            this.zoomingUnits,
            this.orientation
        );
        this.coord = PolyominoPacking.prototype.getCoordFromShape(this.shape);
        this.bounds = new Polyomino.IntegerRectangle();

        if (this.spacing === undefined) {
            this.spacing = 0;
        }
        if (this.x === undefined) {
            this.x = 0;
        }
        if (this.y === undefined) {
            this.y = 0;
        }
        if (this.id === undefined) {
            this.id = 0;
        }
        if (this.coord === undefined) {
            this.coord = null;
        }
    }

    /**
     * This function return the perimeter of the Polyomino's bounding rectangle.
     * @returns 
     */
    Polyomino.prototype.perimeter = function () {
        return this.bounds.x2 - this.bounds.x1 + this.bounds.y2 - this.bounds.y1;
    };
    return Polyomino;
}());

Polyomino["__class"] = "Polyomino";

(function (Polyomino) {
    /**
     * This auxiliary class defines an integer point.
     * @param {number} x
     * @param {number} y
     * @class
     */
    var IntegerPoint = /** @class */ (function () {
        function IntegerPoint(x, y) {
            if (((typeof x === 'number') || x === null) && ((typeof y === 'number') || y === null)) {
                var __args = arguments;
                if (this.x === undefined) {
                    this.x = 0;
                }
                if (this.y === undefined) {
                    this.y = 0;
                }
                this.x = x;
                this.y = y;
            }
            else if (x === undefined && y === undefined) {
                var __args = arguments;
                if (this.x === undefined) {
                    this.x = 0;
                }
                if (this.y === undefined) {
                    this.y = 0;
                }
            }
            else
                throw new Error('invalid overload');
        }

        /**
         * This method gets the x coordinate of the point.
         * @return {number}
         */
        IntegerPoint.prototype.getX = function () {
            return this.x;
        };

        /**
         * This method sets the x coordinate of the point.
         * @param {number} x
         */
        IntegerPoint.prototype.setX = function (x) {
            this.x = x;
        };

        /**
         * This method gets the y coordinate of the point.
         * @return {number}
         */
        IntegerPoint.prototype.getY = function () {
            return this.y;
        };

        /**
         * This method sets the y coordinate of the point.
         * @param {number} y
         */
        IntegerPoint.prototype.setY = function (y) {
            this.y = y;
        };

        return IntegerPoint;
    }());

    Polyomino.IntegerPoint = IntegerPoint;

    IntegerPoint["__class"] = "Polyomino.IntegerPoint";

    var IntegerRectangle = /** @class */ (function () {
        function IntegerRectangle() {
            if (this.x1 === undefined) {
                this.x1 = 0;
            }
            if (this.y1 === undefined) {
                this.y1 = 0;
            }
            if (this.x2 === undefined) {
                this.x2 = 0;
            }
            if (this.y2 === undefined) {
                this.y2 = 0;
            }
        }
        return IntegerRectangle;
    }());

    Polyomino.IntegerRectangle = IntegerRectangle;

    IntegerRectangle["__class"] = "Polyomino.IntegerRectangle";

})(Polyomino || (Polyomino = {}));

/**
 * The polyomino packing algorithm.
 * @class
 */
var PolyominoPacking = /** @class */ (function () {
    function PolyominoPacking() {
        if (this.pmSorted === undefined) {
            this.pmSorted = null;
        }
        if (this.grid === undefined) {
            this.grid = null;
        }
        if (this.gcx === undefined) {
            this.gcx = 0;
        }
        if (this.gcy === undefined) {
            this.gcy = 0;
        }
        if (this.sizeX === undefined) {
            this.sizeX = 0;
        }
        if (this.sizeY === undefined) {
            this.sizeY = 0;
        }
        if (this.curmino === undefined) {
            this.curmino = 0;
        }
        if (this.random === undefined) {
            this.random = null;
        }
    }

    PolyominoPacking.main = function (N) {
        var polyominoPacking = new PolyominoPacking();
        var polys = [];
        for (var i = 0; i < N; i++) {
            polys.push(PolyominoPacking.prototype.genPolyConvex());
        }
        polyominoPacking.pack(polys);
        return { polyominoPacking, polys };
    };

    PolyominoPacking.generateRandomObjects = function (N) {
        Polyomino.NEXT_POLYOMINO_ID = 1;
        var polys = [];
        for (var i = 0; i < N; i++) {
            polys.push(PolyominoPacking.prototype.genPolyConvex());
        }
        return polys;
    };

    PolyominoPacking.pack = function(polys){
        var polyominoPacking = new PolyominoPacking();
        polyominoPacking.pack(polys);
        return { polyominoPacking, polys };
    }

    /**
     * This method performs polyomino packing.
     * @param {Polyomino[]} pm
     */
    PolyominoPacking.prototype.pack = function (pm) {
        this.pmSorted = /* clone */ pm.slice(0);
        this.makeGrid(5, 5, 0);
        this.random = Math.random();
        for (var k = 0; k < pm.length; k++) {
            this.randomizeMino(pm[k]);
        }
        /* sort */ (function (l, c) {
            if (c.compare)
                l.sort(function (e1, e2) { return c.compare(e1, e2); });
            else
                l.sort(c);
        })(this.pmSorted, new PolyominoPacking.PolyominoPacking$0(this));
        for (this.curmino = 0; this.curmino < pm.length; this.curmino++) {
            {
                this.putMino(this.pmSorted[this.curmino], undefined, undefined, true);
            }
            ;
        }
        // for (var k = 0; k < pm.length; k++) {
        //     {
        //         pm[k].x -= this.gcx;
        //         pm[k].y -= this.gcy;
        //     }
        //     ;
        // }
    };

    PolyominoPacking.prototype.initGrid = function (dimx, dimy) {
        var i;
        this.grid = (function (s) {
            var a = []; while (s-- > 0)
                a.push(null); return a;
        })(dimy);
        for (var i = 0; i < dimy; i++) {
            {
                this.grid[i] = (function (s) {
                    var a = []; while (s-- > 0)
                        a.push(0); return a;
                })(dimx);
            }
            ;
        }
    }

    /**
     * This creates the grid of given dimensions and fills it with the already
     * placed polyominoes.
     * @param {number} dimx
     * @param {number} dimy
     * @param {number} mN
     * @private
     */

    PolyominoPacking.prototype.makeGrid = function (dimx, dimy, mN) {
        this.initGrid(dimx, dimy);

        var dx = (dimx / 2 | 0) - this.gcx;
        var dy = (dimy / 2 | 0) - this.gcy;
        this.gcx = (dimx / 2 | 0);
        this.gcy = (dimy / 2 | 0);
        this.sizeX = dimx;
        this.sizeY = dimy;
        for (var i = 0; i < mN; i++) {
            {
                var p = this.pmSorted[i];
                p.x += dx;
                p.y += dy;
                for (var k = 0; k < /* size */ p.coord.length; k++) {
                    {
                        var xx = p.coord[k].getX() + p.x;
                        var yy = p.coord[k].getY() + p.y;
                        this.grid[yy][xx] = p.id;
                    }
                    ;
                }
            }
            ;
        }
    };

    /**
     * This method checks whether p can be placed in (x,y).
     * @param {number} x
     * @param {number} y
     * @param {Polyomino} p
     * @param {boolean} isSpaced
     * @return {boolean}
     * @private
     */
    PolyominoPacking.prototype.isFreePlace = function (x, y, p, isSpaced) {
        for (var k = 0; k < /* size */ p.coord.length; k++) {
            var xx = p.coord[k].getX() + x;
            var yy = p.coord[k].getY() + y;
            if (!this.isValid(xx, yy)) return false;
            if (isSpaced === true) {
                let xxR = xx;
                let xxL = xx;
                let yyU = yy;
                let yyD = yy;
                for (var m = 0; m <= p.spacing; m++) {
                    xxR += 1;
                    xxL -= 1;
                    yyU -= 1;
                    yyD += 1;
                    if (
                        !this.isValid(xxR, yy) ||
                        !this.isValid(xxL, yy) ||
                        !this.isValid(xx, yyU) ||
                        !this.isValid(xx, yyD) ||

                        !this.isValid(xxR, yyU) ||
                        !this.isValid(xxL, yyU) ||
                        !this.isValid(xxR, yyD) ||
                        !this.isValid(xxL, yyD)
                    )
                        return false;
                }
            }
        }
        p.x = x;
        p.y = y;
        return true;
    };

    /**
     * This tries to find a free place in the grid. The function returns true if the
     * placement is successful.
     *
     * @return {boolean} Description of the Returned Value
     * @param {Polyomino} p
     * @private
     */
    PolyominoPacking.prototype.tryPlacing = function (p, xPos, yPos, isSpaced) {
        var cx = this.gcx - ((p.bounds.x2 + p.bounds.x1) / 2 | 0);
        var cy = this.gcy - ((p.bounds.y2 + p.bounds.y1) / 2 | 0);

        if (xPos !== undefined && yPos !== undefined) {
            cx = xPos;
            cy = yPos;
        }
        if (this.isFreePlace(cx, cy, p, isSpaced)) {
            return true;
        }
        for (var d = 1; d < (this.sizeX / 2 | 0); d++) {
            {
                for (var i = -d; i < d; i++) {
                    {
                        var i1 = ((i + d + 1) / 2 | 0);
                        if ((i & 1) !== 1) {
                            i1 = -i1;
                        }
                        if (this.isFreePlace(-d + cx, -i1 + cy, p, isSpaced)) {
                            return true;
                        }
                        if (this.isFreePlace(d + cx, i1 + cy, p, isSpaced)) {
                            return true;
                        }
                        if (this.isFreePlace(cx - i1, d + cy, p, isSpaced)) {
                            return true;
                        }
                        if (this.isFreePlace(i1 + cx, -d + cy, p, isSpaced)) {
                            return true;
                        }
                    }
                    ;
                }
            }
            ;
        }
        return false;
    };

    /**
     * This method places the given polyomino. The grid is enlarged if necessary.
     * @param {Polyomino} p
     * @private
     */
    PolyominoPacking.prototype.putMino = function (p, xPos, yPos, isSpaced) {
        while ((!this.tryPlacing(p, xPos, yPos, isSpaced))) {
            {
                this.sizeX += 5;
                this.sizeY += 5;
                this.makeGrid(this.sizeX, this.sizeY, this.curmino);
            }
        }
        ;
        for (var k = 0; k < /* size */ p.coord.length; k++) {
            {
                var xx = p.coord[k].getX() + p.x;
                var yy = p.coord[k].getY() + p.y;
                this.grid[yy][xx] = p.id;
            }
            ;
        }
    };

    /**
     * This method makes a random permutation of polyomino cells and calculates the
     * bounding rectangles of the polyominoes.
     * @param {Polyomino} p
     * @private
     */
    PolyominoPacking.prototype.randomizeMino = function (p) {
        var i;
        for (i = 0; i < /* size */ p.coord.length; i++) {
            {
                var i1 = parseInt(Math.random() * (p.coord.length - i)) + i;
                var tmp = p.coord[i];
                /* set */ (p.coord[i] = /* get */ p.coord[i1]);
                /* set */ (p.coord[i1] = tmp);
            }
            ;
        }
        PolyominoPacking.prototype.computeBoundingRectangle(p);
        PolyominoPacking.prototype.setBorder(p);
    };

    /**
     * This method computes the bounding rectangle of the given polyomino. 
     * @param {Polyomino} p
     * @private
     */
    PolyominoPacking.prototype.computeBoundingRectangle = function (p) {
        var rect = p.bounds;
        rect.x1 = 2147483647;
        rect.y1 = 2147483647;
        rect.x2 = 0;
        rect.y2 = 0;
        if (p.x == undefined) p.x = 0;
        if (p.y == undefined) p.y = 0;
        for (var i = 0; i < /* size */ p.coord.length; i++) {
            {
                if ( /* get */p.coord[i].getX() < rect.x1) {
                    rect.x1 = /* get */ p.coord[i].getX();
                }
                if ( /* get */p.coord[i].getY() < rect.y1) {
                    rect.y1 = /* get */ p.coord[i].getY();
                }
                if ( /* get */p.coord[i].getX() > rect.x2) {
                    rect.x2 = /* get */ p.coord[i].getX();
                }
                if ( /* get */p.coord[i].getY() > rect.y2) {
                    rect.y2 = /* get */ p.coord[i].getY();
                }
            }
            ;
        }
    }

    /**
     * This method checks whether (x,y) is a valid and a free space.
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     * @private
     */
    PolyominoPacking.prototype.isValid = function (x, y) {
        if (x < 0 || y < 0 || x >= this.sizeX || y >= this.sizeY) {
            return false;
        }
        if (this.grid[y][x] !== 0) {
            return false;
        }
        return true;
    }

    PolyominoPacking.prototype.genPolyConvex = function () {
        let originalShape = SHAPES[Miscellaneous.getRandomInt(0, SHAPES.length - 1)];

        let zoomingFac = Miscellaneous.getRandomInt(2, 2);
        let zoomingUnits = zoomingFac == 2 ? Math.min(originalShape.length, originalShape[0].length) : 0;
        let orientation = Miscellaneous.getRandomInt(0, 4);

        return new Polyomino(originalShape, zoomingUnits, orientation);
    };

    PolyominoPacking.prototype.scaleAndOrientShape = function (originalShape, scalingUnits, orientation) {
        let shape = PolyominoPacking.prototype.scalePoly(originalShape, scalingUnits);
        shape = PolyominoPacking.prototype.setOrientation(shape, orientation);
        return shape;
    }

    PolyominoPacking.prototype.setOrientation = function (shape, orientation) {
        orientation = orientation % 4;
        if (orientation >= 1) {
            shape = Miscellaneous.rotateClockwise(shape);
        }
        if (orientation >= 2) {
            shape = Miscellaneous.rotateClockwise(shape);
        }
        if (orientation >= 3) {
            shape = Miscellaneous.rotateClockwise(shape);
        }
        return shape;
    }

    PolyominoPacking.prototype.getCoordFromShape = function (shape) {
        let pmCoord = [];
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[i].length; j++) {
                if (shape[i][j] !== 1) continue;

                pmCoord.push(new Polyomino.IntegerPoint(j, i));
            }
        }
        return pmCoord;
    }

    PolyominoPacking.prototype.setBorder = function (p) {
        let border = [];
        p.isBorder = {};

        for (var k = 0; k < p.coord.length; k++) {
            var x = p.coord[k].getX();
            var y = p.coord[k].getY();

            if (!p.shape[y + 1] || !p.shape[y + 1][x]) border.push({ x, y, "orientation": "down" });
            if (!p.shape[y - 1] || !p.shape[y - 1][x]) border.push({ x, y, "orientation": "up" });
            if (!p.shape[y] || !p.shape[y][x + 1]) border.push({ x, y, "orientation": "right" });
            if (!p.shape[y] || !p.shape[y][x - 1]) border.push({ x, y, "orientation": "left" });

            if (!p.shape[y + 1] || !p.shape[y + 1][x - 1]) border.push({ x, y, "orientation": "inner" });
            if (!p.shape[y + 1] || !p.shape[y + 1][x + 1]) border.push({ x, y, "orientation": "inner" });
            if (!p.shape[y - 1] || !p.shape[y - 1][x - 1]) border.push({ x, y, "orientation": "inner" });
            if (!p.shape[y - 1] || !p.shape[y - 1][x + 1]) border.push({ x, y, "orientation": "inner" });


            if ((!p.shape[y + 1] || !p.shape[y + 1][x]) && (!p.shape[y] || !p.shape[y][x - 1])) border.push({ x, y, "orientation": "down-left-corner" });
            if ((!p.shape[y + 1] || !p.shape[y + 1][x]) && (!p.shape[y] || !p.shape[y][x + 1])) border.push({ x, y, "orientation": "down-right-corner" });
            if ((!p.shape[y - 1] || !p.shape[y - 1][x]) && (!p.shape[y] || !p.shape[y][x - 1])) border.push({ x, y, "orientation": "up-left-corner" });
            if ((!p.shape[y - 1] || !p.shape[y - 1][x]) && (!p.shape[y] || !p.shape[y][x + 1])) border.push({ x, y, "orientation": "up-right-corner" });
        }

        for (const b of border) {
            p.isBorder[`${b.x}*${b.y}`] = true;
        }

        p.border = border;
        return border;
    }
    /**
     * This method increases the polyomino with a factor in the x and y direction.
     * @param {number[][]} shape Shape to be scaled.
     * @param {number} fac Value to be increased in the x and y direction.
     * @private 
     */
    PolyominoPacking.prototype.scalePoly = function (shape, fac) {
        if (fac === 0) return shape;
        let newRowNum = shape.length + fac;
        let newColNum = shape[0].length + fac;
        let emptyGrid = Miscellaneous.init_2D_array(newRowNum, newColNum);
        const facX = shape.length / newRowNum;
        const facY = shape[0].length / newColNum;
        for (let i = 0; i < newRowNum; i++) {
            for (let j = 0; j < newColNum; j++) {
                const floorY = Math.floor(i * facY);
                const floorX = Math.floor(j * facX);
                const ceilY = Math.ceil(i * facY);
                const ceilX = Math.ceil(j * facX);

                let c1 = shape[floorY] && shape[floorY][floorX] ? 1 : 0;
                let c2 = shape[floorY] && shape[floorY][ceilX] ? 1 : 0;
                let c3 = shape[ceilY] && shape[ceilY][floorX] ? 1 : 0;
                let c4 = shape[ceilY] && shape[ceilY][ceilX] ? 1 : 0;

                const filled = Math.round(c1 + c2 + c3 + c4) > 0 ? 1 : 0;

                emptyGrid[i][j] = filled;
            }
        }
        return emptyGrid;
    }

    /**
     * This method computes the center of the given Polyomino relative to its bounding rectangle.
     * @param {Polyomino} p
     * @private
     */
    PolyominoPacking.prototype.minoCenterRelativeToBoundingRectangle = function (p) {
        return {
            "x": Math.round((p.bounds.x2 + p.bounds.x1) / 2 | 0),
            "y": Math.round((p.bounds.y2 + p.bounds.y1) / 2 | 0)
        };
    }

    /**
     * This method computes the center of the given Polyomino relative to its x and y position.
     * @param {Polyomino} p
     * @public
     */
    PolyominoPacking.minoCenterRelativeToPosition = function (p) {
        return {
            "x": Math.round((p.bounds.x2 + p.bounds.x1) / 2 | 0) + p.x,
            "y": Math.round((p.bounds.y2 + p.bounds.y1) / 2 | 0) + p.y
        };
    }

    /**
     * This function enlarge the given polyomino 1 unit in the x and y directions.
     * @param {Polyomino} p polyomino to be enlarged. 
     * @public 
     */
    PolyominoPacking.enlargePoly = function (p, hideAlert = false) {
        if (p == undefined) return;
        if (p.zoomingUnits >= 40) {
            if (!hideAlert)
                alert("Reached enlarging limit.");
            return p;
        }
        p.zoomingUnits++;

        // Store the center position for recalculating the position of the polyomino after scaling.
        let c = PolyominoPacking.prototype.minoCenterRelativeToBoundingRectangle(p);
        let polyCenterX = p.x + c.x;
        let polyCenterY = p.y + c.y;

        p.shape = PolyominoPacking.prototype.scalePoly(p.originalShape, p.zoomingUnits);
        p.shape = PolyominoPacking.prototype.setOrientation(p.shape, p.orientation);
        p.coord = PolyominoPacking.prototype.getCoordFromShape(p.shape, p.mirror);

        // Recalculate the position of the polyomino.
        PolyominoPacking.prototype.computeBoundingRectangle(p);
        PolyominoPacking.prototype.setBorder(p);

        c = PolyominoPacking.prototype.minoCenterRelativeToBoundingRectangle(p)
        p.x = polyCenterX - c.x;
        p.y = polyCenterY - c.y;
        return p;
    }

    /**
     * This function shrinks the given polyomino 1 unit in the x and y directions.
     * @param {Polyomino} p polyomino to be shrunk. 
     * @param {Boolean} hiderAlert a flag to show or hide the shrinking limit alert. 
     * @public
     */
    PolyominoPacking.shrinkPoly = function (p, hideAlert = false) {
        if (p == undefined) return;
        p.zoomingUnits--;
        if (p.zoomingUnits < 1) {
            p.zoomingUnits = 1;
            if (!hideAlert)
                alert("Reached shrinking limit.");
            return p;
        }

        // Store the center position for recalculating the position of the polyomino after scaling.
        let c = PolyominoPacking.prototype.minoCenterRelativeToBoundingRectangle(p);
        let polyCenterX = p.x + c.x;
        let polyCenterY = p.y + c.y;

        p.shape = PolyominoPacking.prototype.scalePoly(p.originalShape, p.zoomingUnits);
        p.shape = PolyominoPacking.prototype.setOrientation(p.shape, p.orientation);
        p.coord = PolyominoPacking.prototype.getCoordFromShape(p.shape, p.mirror);

        // Recalculate the position of the polyomino.
        PolyominoPacking.prototype.computeBoundingRectangle(p);
        PolyominoPacking.prototype.setBorder(p);

        c = PolyominoPacking.prototype.minoCenterRelativeToBoundingRectangle(p)
        p.x = polyCenterX - c.x;
        p.y = polyCenterY - c.y;
        return p;
    }

    /**
     * This function rotates the given polyomino by a 90 degree.
     * @param {Polyomino} p polyomino to be rotated. 
     * @public
     */
    PolyominoPacking.rotateClockWise = function (p) {
        p.shape = Miscellaneous.rotateClockwise(p.shape);
        p.orientation++;
        p.orientation %= 4; // Reset counter after every a net of four clockwise rotations.
        p.coord = PolyominoPacking.prototype.getCoordFromShape(p.shape, p.mirror);
        PolyominoPacking.prototype.computeBoundingRectangle(p);
        PolyominoPacking.prototype.setBorder(p);
        return p;
    }

    /**
     * This function rotates the given polyomino by a -90 degree.
     * @param {Polyomino} p polyomino to be rotated. 
     * @public
     */
    PolyominoPacking.rotateCounterClockwise = function (p) {
        p.shape = Miscellaneous.rotateCounterClockwise(p.shape);
        p.orientation--;

        // Reset counter after every a net of four anticlockwise rotations.
        p.orientation = (p.orientation + 4) % 4;
        p.coord = PolyominoPacking.prototype.getCoordFromShape(p.shape, p.mirror);
        PolyominoPacking.prototype.computeBoundingRectangle(p);
        PolyominoPacking.prototype.setBorder(p);
        return p;
    }

    /**
     * Creates a dummy Polyomino at the given position.
     * @param {number} x x-position
     * @param {number} y y-position
     * @public
     */
    PolyominoPacking.createDummyPoly = function (x, y) {
        let poly = new Polyomino([[1, 1], [1, 1]], 0, 0);
        poly.x = x;
        poly.y = y;

        PolyominoPacking.prototype.computeBoundingRectangle(poly);
        PolyominoPacking.prototype.setBorder(poly);
        return poly;
    }

    return PolyominoPacking;
}());

PolyominoPacking["__class"] = "PolyominoPacking";

(function (PolyominoPacking) {
    var PolyominoPacking$0 = /** @class */ (function () {
        function PolyominoPacking$0(__parent) {
            this.__parent = __parent;
        }
        /**
         *
         * @param {Polyomino} o1
         * @param {Polyomino} o2
         * @return {number}
         */
        PolyominoPacking$0.prototype.compare = function (o1, o2) {
            return /* compare */ (o2.perimeter() - o1.perimeter());
        };
        return PolyominoPacking$0;
    }());
    PolyominoPacking.PolyominoPacking$0 = PolyominoPacking$0;
    PolyominoPacking$0["__interfaces"] = ["java.util.Comparator"];
})(PolyominoPacking || (PolyominoPacking = {}));

export { PolyominoPacking };
