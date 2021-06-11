var Miscellaneous = (function () {
    function Miscellaneous() { }
    Miscellaneous.getRandomInt = function (min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    Miscellaneous.isValid_2D_grid_index = function (row, col, grid) {
        return row >= 0 && col >= 0 && row < grid.length && col < grid[0].length;
    }

    Miscellaneous.init_2D_array = function (rowNum, colNum) {
        let x = new Array(rowNum);
        for (var i = 0; i < x.length; i++) {
            x[i] = new Array(colNum).fill(0);
        }
        return x;
    }

    Miscellaneous.init_2D_array_undefined = function (rowNum, colNum) {
        let x = new Array(rowNum);
        for (var i = 0; i < x.length; i++) {
            x[i] = new Array(colNum).fill(undefined);
        }
        return x;
    }

    Miscellaneous.convertToSquareMatrix = function (matrix) {
        let rowNum = matrix.length;
        let colNum = matrix[0].length;
        let n = Math.max(rowNum, colNum);
        let squareMatrix = Miscellaneous.init_2D_array(n, n);
        for (let i = 0; i < rowNum; i++) {
            for (let j = 0; j < colNum; j++) {
                squareMatrix[i][j] = matrix[i][j];
            }
        }
        return squareMatrix;
    }

    Miscellaneous.rotateCounterClockwise = function (matrix) {
        var n = matrix.length;
        for (var i = 0; i < n / 2; i++) {
            for (var j = i; j < n - i - 1; j++) {
                var tmp = matrix[i][j];
                matrix[i][j] = matrix[j][n - i - 1];
                matrix[j][n - i - 1] = matrix[n - i - 1][n - j - 1];
                matrix[n - i - 1][n - j - 1] = matrix[n - j - 1][i];
                matrix[n - j - 1][i] = tmp;
            }
        }
        return matrix;
    }

    Miscellaneous.rotateClockwise = function (matrix) {
        var n = matrix.length;
        for (var i = 0; i < n / 2; i++) {
            for (var j = i; j < n - i - 1; j++) {
                var tmp = matrix[i][j];
                matrix[i][j] = matrix[n - j - 1][i];
                matrix[n - j - 1][i] = matrix[n - i - 1][n - j - 1];
                matrix[n - i - 1][n - j - 1] = matrix[j][n - i - 1];
                matrix[j][n - i - 1] = tmp;
            }
        }
        return matrix;
    }


    // line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
    // Determine the intersection point of two line segments
    // Return FALSE if the lines don't intersect
    Miscellaneous.intersect = function (x1, y1, x2, y2, x3, y3, x4, y4) {

        // Check if none of the lines are of length 0
        if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
            return false
        }

        let denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

        // Lines are parallel
        if (denominator === 0) {
            return false
        }

        let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
        let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

        // is the intersection along the segments
        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
            return false
        }

        // Return a object with the x and y coordinates of the intersection
        let x = x1 + ua * (x2 - x1)
        let y = y1 + ua * (y2 - y1)

        return { x, y }
    }

    Miscellaneous.ruler = function (x1, y1, x2, y2, fraction) {
        // f(t) = (1 − t)P + tQ
        // t -> fraction
        // P -> {x1, y1}
        // Q -> {x2, y2}

        let fX = (1 - fraction) * x1 + fraction * x2;
        let fY = (1 - fraction) * y1 + fraction * y2;

        return { "x": fX, "y": fY };
    }

    Miscellaneous.getBoundingRectangleCorners = function (bounds, x, y) {
        let b_x1 = bounds.x1 + x;
        let b_y1 = bounds.y1 + y;
        let b_x2 = bounds.x2 + x;
        let b_y2 = bounds.y2 + y;
        /**
         * A----AB----B
         * |          |
         * DA         BC
         * |          |
         * D----CD----C
         */
        let A = {
            "x": b_x1,
            "y": b_y1
        }
        let B = {
            "x": b_x2,
            "y": b_y1
        }
        let C = {
            "x": b_x2,
            "y": b_y2
        }
        let D = {
            "x": b_x1,
            "y": b_y2
        }
        let AB = {
            "x": Math.round((b_x1 + b_x2) / 2),
            "y": b_y1,
        }
        let BC = {
            "x": b_x2,
            "y": Math.round((b_y1 + b_y2) / 2),
        }
        let CD = {
            "x": Math.round((b_x1 + b_x2) / 2),
            "y": b_y2,
        }
        let DA = {
            "x": b_x1,
            "y": Math.round((b_y1 + b_y2) / 2),
        }
        return { A, B, C, D, AB, BC, CD, DA };
    }

    Miscellaneous.bilinearTransformation = function (grid, newGrid) {
        let newRowNum = newGrid.length;
        let newColNum = newGrid[0].length;
        const facX = grid.length / newRowNum;
        const facY = grid[0].length / newColNum;
        for (let i = 0; i < newRowNum; i++) {
            for (let j = 0; j < newColNum; j++) {
                const floorY = Math.floor(i * facY);
                const floorX = Math.floor(j * facX);
                const ceilY = Math.ceil(i * facY);
                const ceilX = Math.ceil(j * facX);

                let c1 = grid[floorY] && grid[floorY][floorX] ? grid[floorY][floorX] : 0;
                let c2 = grid[floorY] && grid[floorY][ceilX] ? grid[floorY][ceilX] : 0;
                let c3 = grid[ceilY] && grid[ceilY][floorX] ? grid[ceilY][floorX] : 0;
                let c4 = grid[ceilY] && grid[ceilY][ceilX] ? grid[ceilY][ceilX] : 0;

                newGrid[i][j] = (c1 + c2 + c3 + c4) / 4;
            }
        }
        return newGrid;
    }

    Miscellaneous.calcStraightLine = function(start, end) {
        var coordinatesArray = new Array();
        // Translate coordinates
        var x1 = start.x;
        var y1 = start.y;
        var x2 = end.x;
        var y2 = end.y;

        // Define differences and error check
        var dx = Math.abs(x2 - x1);
        var dy = Math.abs(y2 - y1);
        var sx = (x1 < x2) ? 1 : -1;
        var sy = (y1 < y2) ? 1 : -1;
        var err = dx - dy;

        coordinatesArray.push({ "y": y1, "x": x1 });

        while (!((x1 == x2) && (y1 == y2))) {
            var e2 = err << 1;
            if (e2 > -dy) {
                err -= dy;
                x1 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y1 += sy;
            }
            coordinatesArray.push({ "y": y1, "x": x1 });
        }
        return coordinatesArray;
    }

    return Miscellaneous;
})();

export {Miscellaneous};
