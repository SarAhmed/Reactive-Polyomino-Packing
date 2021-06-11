import { COLOR_SET } from "./utils/colorSet.js";
import { RPP } from "./RPP.js";

var Render = (function () {
    let canvas = document.getElementById("canvas");
    let canvas2 = document.getElementById("canvas2");
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 0.05;
    const ctx2 = canvas2.getContext("2d");
    ctx2.lineWidth = 0.05;

    let Y_OFFSET = 0;
    let X_OFFSET = 0;
    let ROW_OFFSET = 0;
    let COL_OFFSET = 0;

    let CELL_HEIGHT_AND_WIDTH = 1
    let staticPolyominoPacking;

    let POLYOMINOES;
    let NUMBER_OF_ROWS;
    let NUMBER_OF_COLUMNS;

    let LAYOUT_GRID;
    function Render() {

    }

    Render.init = function (packing, grid) {
        staticPolyominoPacking = packing;
        LAYOUT_GRID = grid;
        POLYOMINOES = staticPolyominoPacking.polyominoPacking.grid;
        NUMBER_OF_ROWS = POLYOMINOES.length;
        NUMBER_OF_COLUMNS = POLYOMINOES[0].length;
        CELL_HEIGHT_AND_WIDTH = Math.round(4 * 150 / NUMBER_OF_ROWS);

        canvas.height = NUMBER_OF_ROWS * CELL_HEIGHT_AND_WIDTH;
        canvas.width = NUMBER_OF_COLUMNS * CELL_HEIGHT_AND_WIDTH;

        canvas2.height = canvas.height;
        canvas2.width = canvas.width;
    }

    /**
     * This function draws the given polyomino on the layout.
     * @param {Polyomino} p Polyomino to be drawn
    */
    Render.drawPolyOnGrid = function (p) {
        if (p == undefined) return;
        for (let k = 0; k < p.coord.length; k++) {
            let coordX = p.coord[k].getX();
            let coordY = p.coord[k].getY();

            let xx = p.coord[k].getX() + p.x + COL_OFFSET;
            let yy = p.coord[k].getY() + p.y + ROW_OFFSET;

            if (p.isBorder && p.isBorder[`${coordX}*${coordY}`]) {
                ctx.fillStyle = COLOR_SET[0];
                ctx.fillRect(xx * CELL_HEIGHT_AND_WIDTH, yy * CELL_HEIGHT_AND_WIDTH,
                    CELL_HEIGHT_AND_WIDTH, CELL_HEIGHT_AND_WIDTH);
            } else {
                ctx.fillStyle = COLOR_SET[p.id % COLOR_SET.length];
                ctx.fillRect(xx * CELL_HEIGHT_AND_WIDTH, yy * CELL_HEIGHT_AND_WIDTH,
                    CELL_HEIGHT_AND_WIDTH, CELL_HEIGHT_AND_WIDTH);
            }
        }
    }

    /**
 * This function draws the border of the layout
 */
    Render.drawLayoutBorder = function () {
        for (let i = 0; i < NUMBER_OF_ROWS; i++) {
            ctx.fillStyle = COLOR_SET[0];
            let yy = i;

            // Left Border
            let xx = 0;

            ctx.fillRect(X_OFFSET + xx * CELL_HEIGHT_AND_WIDTH, Y_OFFSET + yy * CELL_HEIGHT_AND_WIDTH,
                CELL_HEIGHT_AND_WIDTH, CELL_HEIGHT_AND_WIDTH);

            // Right Border
            xx = (NUMBER_OF_COLUMNS - 1);

            ctx.fillRect(X_OFFSET + xx * CELL_HEIGHT_AND_WIDTH, Y_OFFSET + yy * CELL_HEIGHT_AND_WIDTH,
                CELL_HEIGHT_AND_WIDTH, CELL_HEIGHT_AND_WIDTH);
        }

        for (let i = 0; i < NUMBER_OF_COLUMNS; i++) {
            ctx.fillStyle = COLOR_SET[0];
            let xx = i;

            // Top Border
            let yy = 0;

            ctx.fillRect(X_OFFSET + xx * CELL_HEIGHT_AND_WIDTH, Y_OFFSET + yy * CELL_HEIGHT_AND_WIDTH,
                CELL_HEIGHT_AND_WIDTH, CELL_HEIGHT_AND_WIDTH);

            // Bottom Border
            yy = (NUMBER_OF_ROWS - 1);

            ctx.fillRect(X_OFFSET + xx * CELL_HEIGHT_AND_WIDTH, Y_OFFSET + yy * CELL_HEIGHT_AND_WIDTH,
                CELL_HEIGHT_AND_WIDTH, CELL_HEIGHT_AND_WIDTH);
        }
    }

    /**
 * This function removes the given polyomino from the layout.
 * @param {Polyomino} p Polyomino to be removed.
 */
    Render.erasePolyFromGrid = function (p) {
        if (p == undefined) return;

        for (let k = 0; k < p.coord.length; k++) {
            let xx = p.coord[k].getX() + p.x + COL_OFFSET;
            let yy = p.coord[k].getY() + p.y + ROW_OFFSET;

            if (LAYOUT_GRID[yy][xx] && Object.keys(LAYOUT_GRID[yy][xx]).length > 0) {
                let polyId = Object.keys(LAYOUT_GRID[yy][xx])[0];
                let poly = getPolyById(polyId);
                if (poly == undefined) continue;
                let coordX = xx - COL_OFFSET - poly.x;
                let coordY = yy - COL_OFFSET - poly.y;
                if (poly.isBorder && poly.isBorder[`${coordX}*${coordY}`]) {
                    ctx.fillStyle = COLOR_SET[0];
                    ctx.fillRect(xx * CELL_HEIGHT_AND_WIDTH, yy * CELL_HEIGHT_AND_WIDTH,
                        CELL_HEIGHT_AND_WIDTH, CELL_HEIGHT_AND_WIDTH);
                } else {
                    ctx.fillStyle = COLOR_SET[polyId % COLOR_SET.length];
                    ctx.fillRect(xx * CELL_HEIGHT_AND_WIDTH, yy * CELL_HEIGHT_AND_WIDTH,
                        CELL_HEIGHT_AND_WIDTH, CELL_HEIGHT_AND_WIDTH);
                }
            } else {
                ctx.fillStyle = "white";
                ctx.fillRect(xx * CELL_HEIGHT_AND_WIDTH, yy * CELL_HEIGHT_AND_WIDTH,
                    CELL_HEIGHT_AND_WIDTH, CELL_HEIGHT_AND_WIDTH);

                // ctx.strokeStyle = "lightgrey";
                // ctx.strokeRect(xx * CELL_HEIGHT_AND_WIDTH, yy * CELL_HEIGHT_AND_WIDTH,
                //     CELL_HEIGHT_AND_WIDTH, CELL_HEIGHT_AND_WIDTH);
            }
        }
    }

    /**
 * This function retrieves the polyomino of the given id
 * @param {number} id id of the polyomino
 * @returns Polyomino with the given id
 */
    function getPolyById(id) {
        return staticPolyominoPacking.polys[id - 1];
    }
    return Render;
}());

export { Render };