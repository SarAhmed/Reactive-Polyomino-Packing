import { GRADIENT } from "./utils/gradient.js";
import { Miscellaneous } from "./utils/miscellaneous.js";
import { PolyominoPacking } from "./polyominoPacking.js";
import { Render } from "./render.js"
import { EventListeners } from "./eventListeners.js"
import Delaunator from 'https://cdn.skypack.dev/delaunator@5.0.0';

var RPP = (function () {
    const TIME_SLICE_ms = 100;
    const HALF_TIME_SLICE_ms = TIME_SLICE_ms / 2;
    const SPACING = 2;

    let NUMBER_OF_POLYOMINOES;
    let staticPolyominoPacking;
    let POLYOMINOES;
    let NUMBER_OF_ROWS;
    let NUMBER_OF_COLUMNS;
    let LAYOUT_GRID;
    let APPLIED_GRADIENT;

    let overlappingPairsOfMinos = [];
    let overlappingPairsOfMinos_set = {};

    let underlappingMinos = [];

    let distributerMinos = [];
    let isDistributerMino = {};
    let isRemovedMino = {};

    let delaunayEdges = {};
    let FULLNESS = 0;
    let filledCellsCounter = 0;
    let levels = [];
    let enlargingLevelIterator = 0;
    let scaledDownPolyominoes = [];

    function RPP() { }

    function init(polys) {
        staticPolyominoPacking = PolyominoPacking.pack(polys);
        POLYOMINOES = staticPolyominoPacking.polyominoPacking.grid;

        NUMBER_OF_ROWS = POLYOMINOES.length;
        NUMBER_OF_COLUMNS = POLYOMINOES[0].length;

        LAYOUT_GRID = Miscellaneous.init_2D_array_undefined(NUMBER_OF_ROWS, NUMBER_OF_COLUMNS);

        Render.init(staticPolyominoPacking, LAYOUT_GRID);
        EventListeners.init(staticPolyominoPacking, LAYOUT_GRID);
        APPLIED_GRADIENT = Miscellaneous.bilinearTransformation(
            GRADIENT,
            Miscellaneous.init_2D_array(NUMBER_OF_ROWS, NUMBER_OF_ROWS)
        );

        overlappingPairsOfMinos = [];
        overlappingPairsOfMinos_set = {};

        underlappingMinos = [];

        distributerMinos = [];
        isDistributerMino = {};
        isRemovedMino = {};

        delaunayEdges = {};
        FULLNESS = 0;
        filledCellsCounter = 0;
        levels = [];
        enlargingLevelIterator = 0;
        scaledDownPolyominoes = [];

        drawLayout();
        generateDelTrigEdges()
        periodicCall();
        scheduler();
    }

    function getFullness() {
        return filledCellsCounter / (NUMBER_OF_ROWS * NUMBER_OF_COLUMNS);
    }

    function getAveragePolyominoWeight() {
        return filledCellsCounter / NUMBER_OF_POLYOMINOES;
    }

    /**
     * This function renders the whole layout.
     */
    function drawLayout() {
        for (const p of staticPolyominoPacking.polys) {
            drawPolyOnGrid(p);
        }
        Render.drawLayoutBorder();
        FULLNESS = getFullness();
    }

    /**
     * This function retrieves the polyomino of the given id.
     * @param {number} id id of the polyomino
     * @returns Polyomino with the given id
     */
    RPP.getPolyById = function (id) {
        if (isDistributerMino[id - 1])
            return distributerMinos[id - 1 - staticPolyominoPacking.polys.length];
        return staticPolyominoPacking.polys[id - 1];
    }

    /**
     * This function generates the triangulation carried through the center of the polyominoes.
     */
    function generateDelTrigEdges() {
        distributerMinos = distributerMinos.filter(p => !isRemovedMino[p.id - 1]);
        delaunayEdges = {} // Re-initialize delaunayEdges array.

        let delaunay = Delaunator.from(
            staticPolyominoPacking.polys.concat(distributerMinos),
            (p) => PolyominoPacking.minoCenterRelativeToPosition(p).x,
            (p) => PolyominoPacking.minoCenterRelativeToPosition(p).y
        );

        let triangles = delaunay.triangles;

        for (let i = 0; i < triangles.length; i += 3) {
            let p0 = RPP.getPolyById(triangles[i] + 1);
            let p1 = RPP.getPolyById(triangles[i + 1] + 1);
            let p2 = RPP.getPolyById(triangles[i + 2] + 1);

            let a = p0.id - 1;
            let b = p1.id - 1;
            let c = p2.id - 1;

            if (delaunayEdges[a] == undefined) delaunayEdges[a] = [];
            if (delaunayEdges[b] == undefined) delaunayEdges[b] = [];
            if (delaunayEdges[c] == undefined) delaunayEdges[c] = [];

            delaunayEdges[a].push(b);
            delaunayEdges[a].push(c);

            delaunayEdges[b].push(a);
            delaunayEdges[b].push(c);

            delaunayEdges[c].push(a);
            delaunayEdges[c].push(b);
        }

        getAndSetLevels({ ...delaunayEdges });
    }

    function getPolyominoInCenter() {
        let minimumPosition = Number.MAX_VALUE;
        let centerOfGridPolyomino;
        for (const poly of staticPolyominoPacking.polys) {
            let center = PolyominoPacking.minoCenterRelativeToPosition(poly);
            if (minimumPosition >= Math.max(Math.abs(center.x), Math.abs(center.y))) {
                minimumPosition = Math.max(Math.abs(center.x), Math.abs(center.y));
                centerOfGridPolyomino = poly;
            }
        }
        return centerOfGridPolyomino;
    }

    function enlargeLevelHandler() {
        let start = new Date();
        const FU = FULLNESS + 0.01;
        while (new Date - start < 15 && getFullness() > FU) {
            let pId = levels[(enlargingLevelIterator++ + levels.length) % levels.length];
            if (isDistributerMino[pId]) continue;

            let poly = RPP.getPolyById(pId + 1);
            removePolyFromGrid(poly);
            poly = PolyominoPacking.shrinkPoly(poly, true);
            scaledDownPolyominoes.push(poly.id - 1);
            translatePolyomino(poly, 0, 0);
        }
        if (getFullness() > FU)
            setTimeout(() => {
                enlargeLevelHandler()
            }, 10);
    }

    function shrinkLevelHandler() {
        let start = new Date();
        const FU = FULLNESS + 0.01;
        while (new Date - start < 15 && getFullness() < FU) {
            let pId = levels[((enlargingLevelIterator)-- + levels.length) % levels.length];
            if (isDistributerMino[pId]) continue;

            let poly = scaledDownPolyominoes.length ? RPP.getPolyById(scaledDownPolyominoes.pop()) : RPP.getPolyById(pId + 1);
            removePolyFromGrid(poly);
            poly = PolyominoPacking.enlargePoly(poly, true);
            translatePolyomino(poly, 0, 0);
        }
        if (getFullness() < FU)
            setTimeout(() => {
                shrinkLevelHandler()
            }, 0);
    }

    function getAndSetLevels(delaunayEdges) {
        levels = [];
        let queue = [];
        let visited = {};
        let centerOfGridPolyomino = getPolyominoInCenter();
        queue.push(centerOfGridPolyomino.id - 1);
        visited[centerOfGridPolyomino.id - 1] = true;
        levels.push(centerOfGridPolyomino.id - 1)
        while (queue.length) {
            let pId = queue.shift();
            if (delaunayEdges[pId]) {
                for (const child of delaunayEdges[pId]) {
                    if (visited[child]) continue;
                    visited[child] = true;
                    queue.push(child);
                    levels.unshift(child);
                }
            }
        }
    }

    /**
     * This function checks if translating polyomino `p` with a delta value in x and y direction, will result in an overlapping with polyomino `pivot`.
     * @param {Polyomino} p 
     * @param {number} deltaX 
     * @param {number} deltaY 
     * @param {Polyomino} pivot 
     * @returns true if the after applying translation with deltaX and deltaY on polyomino `p`, `p` overlaps with `pivot`.
     */
    function areOverlappingSpace(p, deltaX, deltaY, pivot) {
        if (pivot == null) return false;
        for (let k = 0; k < p.coord.length; k++) {
            let xx = p.coord[k].getX() + p.x + deltaX;
            let yy = p.coord[k].getY() + p.y + deltaY;
            if (LAYOUT_GRID[yy] && LAYOUT_GRID[yy][xx] && LAYOUT_GRID[yy][xx][pivot.id]) {
                return true;
            }
        }
        return false;
    }

    /**
     * This function adds the pair of overlapping polyomino into `overlappingPairsOfMinos` array to be later processed.
     * @param {number} id1 ID of the first polyomino.
     * @param {number} id2 ID of the second polyomino.
     * @returns true if the pair of polyominoes were added successfully (i.e. not already overlapping), false otherwise.
     */
    function adjustOverlapping(id1, id2, highPriority = false) {
        const hash1 = `${id1}*${id2}`;
        const hash2 = `${id2}*${id1}`;

        // Check if the pair given pair of IDs were already added in a previous step in `overlappingPairsOfMinos` array to be processed.
        if (overlappingPairsOfMinos_set[hash1] || overlappingPairsOfMinos_set[hash2]) {
            return false;
        }

        let pair = {
            "id_1": id1,
            "id_2": id2,
        };

        if (highPriority)
            overlappingPairsOfMinos.unshift(pair);
        else
            overlappingPairsOfMinos.push(pair);

        overlappingPairsOfMinos_set[hash1] = true;
        overlappingPairsOfMinos_set[hash2] = true;
        return true;
    }

    /**
     * This function adds the underlapping polyomino into `underlappingMinos` array to be later processed.
     * @param {Polyomino} poly
     * @param {boolean} shrinking true if the underlapping is resulting from shrinking polyomino `poly`.
     */
    function adjustUnderLapping(poly, representative, strength = 1) {
        if (representative == undefined) representative = poly;
        underlappingMinos.push({ poly, representative, strength });
    }

    /**
     * This function draws the given polyomino on the layout.
     * @param {Polyomino} p Polyomino to be drawn
     */
    function drawPolyOnGrid(p) {
        if (p == undefined) return;

        let start = new Date();
        respectAspectRatio(p);

        const id = p.id;

        for (let k = 0; k < p.coord.length; k++) {
            let xx = p.coord[k].getX() + p.x;
            let yy = p.coord[k].getY() + p.y;

            filledCellsCounter++

            if (LAYOUT_GRID[yy][xx] == undefined) LAYOUT_GRID[yy][xx] = {};

            for (const poly in LAYOUT_GRID[yy][xx]) {
                if (poly == id ||
                    !adjustOverlapping(id, poly,
                        EventListeners.polyominoDragged && (EventListeners.polyominoDragged.id == p.id || EventListeners.polyominoDragged.id == poly))
                ) continue;
                if (p.itr == undefined) p.itr = 0;
                p.itr++;
                p.collisionTime = start;
            }
            LAYOUT_GRID[yy][xx][id] = true;
        }

        if (start - p.collisionTime >= HALF_TIME_SLICE_ms) {
            p.itr = 0;
        }

        Render.drawPolyOnGrid(p);
    }

    /**
     * This function computes the intersection point of line segment and bounding box of the polyomino.
     * @param {Polyomino} poly 
     * @param {{x: number, y: number}} a start point of the segment.
     * @param {{x: number, y: number}} b end point of the segment.
     */
    function boundingRectangleIntersection(poly, a, b) {
        let b_x1 = poly.bounds.x1 + poly.x;
        let b_y1 = poly.bounds.y1 + poly.y;
        let b_x2 = poly.bounds.x2 + poly.x;
        let b_y2 = poly.bounds.y2 + poly.y;
        /**
         * A---------B
         * |         |
         * |         |
         * D---------C
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

        let intersectAB = Miscellaneous.intersect(A.x, A.y, B.x, B.y, a.x, a.y, b.x, b.y);
        let intersectBC = Miscellaneous.intersect(B.x, B.y, C.x, C.y, a.x, a.y, b.x, b.y);
        let intersectCD = Miscellaneous.intersect(C.x, C.y, D.x, D.y, a.x, a.y, b.x, b.y);
        let intersectDA = Miscellaneous.intersect(D.x, D.y, A.x, A.y, a.x, a.y, b.x, b.y);

        if (intersectAB) return intersectAB;
        if (intersectBC) return intersectBC;
        if (intersectCD) return intersectCD;
        if (intersectDA) return intersectDA;
    }

    /**
     * This function computes the delta value in order to translate `p1` in direction of `p2` with a number of `steps`.
     * @param {Polyomino} p1 Polyomino to be translated.
     * @param {Polyomino} p2 Referenced polyomino.
     * @param {number} steps magnitude of the translation (i.e. delta value).
     */
    function parametricEquationOfMinos(p1, p2, steps) {
        if (isNaN(p1.x)) return { deltaX: 0, deltaY: 0 }
        let c1 = PolyominoPacking.minoCenterRelativeToPosition(p1);
        let c2 = PolyominoPacking.minoCenterRelativeToPosition(p2);

        let vecX = c1.x - c2.x;
        let vecY = c1.y - c2.y;
        let magnitude = Math.sqrt(vecX * vecX + vecY * vecY);

        if (magnitude == 0) {
            return { "deltaX": Miscellaneous.getRandomInt(-1, 1), "deltaY": Miscellaneous.getRandomInt(-1, 1) }
        }

        vecX = (vecX >= 0 ? Math.ceil(vecX / magnitude) : Math.floor(vecX / magnitude));
        vecY = (vecY >= 0 ? Math.ceil(vecY / magnitude) : Math.floor(vecY / magnitude));

        let deltaX = steps * vecX;
        let deltaY = steps * vecY;

        return { deltaX, deltaY };
    }

    /**
     * This function removes the given polyomino from the layout.
     * @param {Polyomino} p Polyomino to be removed.
     */
    function removePolyFromGrid(p) {
        if (p == undefined) return;
        const id = p.id;

        for (let k = 0; k < p.coord.length; k++) {
            let xx = p.coord[k].getX() + p.x;
            let yy = p.coord[k].getY() + p.y;

            if (LAYOUT_GRID[yy][xx] && LAYOUT_GRID[yy][xx][id]) {
                delete LAYOUT_GRID[yy][xx][id];
                filledCellsCounter--;
            }
        }
        Render.erasePolyFromGrid(p);
    }

    /**
     * This function translates the given polyomino by delta value provided.
     * @param {Polyomino} p Polyomino to be translated
     * @param {number} deltaX translation value in x-direction.
     * @param {number} deltaY translation value in y-direction.
     */
    function translatePolyomino(p, deltaX, deltaY) {
        if (p == undefined || isDistributerMino[p.id - 1]) return;
        const id = p.id
        if (id === 0) return;
        staticPolyominoPacking.polyominoPacking.initGrid(NUMBER_OF_ROWS, NUMBER_OF_COLUMNS)
        respectAspectRatio(p);
        removePolyFromGrid(p);

        p.x += deltaX;
        p.y += deltaY;

        drawPolyOnGrid(p);
    }

    /**
     * This function makes sure that the given polyomino respects the aspect ratio of the provided screen size.
     * @param {Polyomino} p Polyomino to be adjusted.
     */
    function respectAspectRatio(p) {
        let start = new Date();

        let minX = Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;

        let maxX = Number.MIN_VALUE;
        let maxY = Number.MIN_VALUE;
        let jumpSize = 1;

        if (EventListeners.polyominoSelected && EventListeners.polyominoSelected.id == p.id) jumpSize = 2;

        for (let k = 0; k < p.coord.length; k++) {
            let xx = p.coord[k].getX() + p.x;
            let yy = p.coord[k].getY() + p.y;
            minX = Math.min(xx, minX);
            minY = Math.min(yy, minY);

            maxX = Math.max(xx, maxX);
            maxY = Math.max(yy, maxY);
        }

        if (minX <= 0 ||
            minY <= 0 ||
            maxX >= NUMBER_OF_COLUMNS - 1 ||
            maxY >= NUMBER_OF_ROWS - 1) {
            if (p.boarderCollisionNum == undefined) p.boarderCollisionNum = 0;
            p.boarderCollisionNum++;
            if (p.boarderCollisionTime && start - p.boarderCollisionTime < HALF_TIME_SLICE_ms) jumpSize += p.boarderCollisionNum;
        }
        if (!p.boarderCollisionTime || start - p.boarderCollisionTime >= HALF_TIME_SLICE_ms)
            p.boarderCollisionNum = 0;

        p.boarderCollisionTime = start;

        if (minX <= 0) {
            p.x += (-minX + jumpSize);
        }

        if (minY <= 1) {
            p.y += (-minY + jumpSize);
        }

        if (maxX >= NUMBER_OF_COLUMNS - 1) {
            p.x -= (maxX - NUMBER_OF_COLUMNS + 1 + jumpSize);
        }

        if (maxY >= NUMBER_OF_ROWS - 1) {
            p.y -= (maxY - NUMBER_OF_ROWS + 1 + jumpSize);
        }
    }

    /**
     * This function creates an attracting polyomino at the given x and y positions.
     * @param {number} x x-position.
     * @param {number} y y-position.
     */
    function createAttractionPoint(x, y) {
        let poly = PolyominoPacking.createDummyPoly(x, y);
        distributerMinos.unshift(poly);
        isDistributerMino[poly.id - 1] = true;
        return poly;
    }

    RPP.handleEnlarge = function (poly) {
        removePolyFromGrid(poly);
        poly = PolyominoPacking.enlargePoly(poly);
        translatePolyomino(poly, 0, 0);

        enlargeLevelHandler();
    }

    RPP.handleShrink = function (poly) {
        removePolyFromGrid(poly);
        poly = PolyominoPacking.shrinkPoly(poly);
        translatePolyomino(poly, 0, 0);

        addAttractionPointsOnBorder(poly, 0.5)
        shrinkLevelHandler();
    }

    RPP.handleRotateAntiClockwise = function (poly) {
        removePolyFromGrid(poly);
        poly = PolyominoPacking.rotateCounterClockwise(poly);
        translatePolyomino(poly, 0, 0);

        addAttractionPointsOnBorder(poly, 0.3)
    }

    RPP.handleRotateClockwise = function (poly) {
        removePolyFromGrid(poly);
        poly = PolyominoPacking.rotateClockWise(poly);
        translatePolyomino(poly, 0, 0);

        addAttractionPointsOnBorder(poly, 0.3)
    }

    RPP.handleDrag = function (poly, deltaX, deltaY) {
        translatePolyomino(poly, deltaX, deltaY);
        RPP.polyominoDrag(poly, deltaX, deltaY);
    }

    RPP.polyominoDrag = function (polyomino, deltaX, deltaY) {
        let pointOfInterest = PolyominoPacking.minoCenterRelativeToPosition(polyomino);

        let d = createAttractionPoint(pointOfInterest.x, pointOfInterest.y);
        adjustUnderLapping(d, polyomino);

        let boundsCorner = Miscellaneous.getBoundingRectangleCorners(polyomino.bounds, polyomino.x, polyomino.y);
        if (deltaX > 0 && deltaY > 0) pointOfInterest = boundsCorner.A;
        else if (deltaX < 0 && deltaY > 0) pointOfInterest = boundsCorner.B;
        else if (deltaX < 0 && deltaY < 0) pointOfInterest = boundsCorner.C;
        else if (deltaX > 0 && deltaY < 0) pointOfInterest = boundsCorner.D;
        else if (deltaX == 0) {
            if (deltaY > 0) pointOfInterest = boundsCorner.AB;
            else if (deltaY < 0) pointOfInterest = boundsCorner.CD;
        } else if (deltaY == 0) {
            if (deltaX > 0) pointOfInterest = boundsCorner.DA;
            else if (deltaX < 0) pointOfInterest = boundsCorner.BC;
        }
        let d2 = createAttractionPoint(pointOfInterest.x, pointOfInterest.y);
        adjustUnderLapping(d2, polyomino);
    }

    function addAttractionPointsOnBorder(poly, strength = 1) {
        for (const cell of poly.border) {
            if (!["up", "down", "left", "right", "inner"].includes(cell.orientation)) continue;

            let x = cell.x + poly.x;
            let y = cell.y + poly.y;
            let d = createAttractionPoint(x, y);
            adjustUnderLapping(d, poly, strength);
        }
    }

    function getOverlappingObjects() {
        let overlapping = [...overlappingPairsOfMinos];
        overlappingPairsOfMinos = [];
        overlappingPairsOfMinos_set = [];
        return overlapping;
    }

    /**
     * This function executes overlapping handler on the provided polyominoes in the queue, either till the queue becomes empty or timer is expired.
     * @param {Polyomino[]} queue Array holding polyominoes to be processed.
     * @param {number} execTime timer.
     */
    async function handleOverlapping(overlapping, execTime) {
        let start = new Date();
        while (overlapping.length) {
            if (new Date() - start > execTime) {
                break;
            }

            let pair = overlapping.shift();

            let p1 = RPP.getPolyById(pair.id_1);
            let p2 = RPP.getPolyById(pair.id_2);

            if (EventListeners.polyominoSelected == undefined ||
                (p1.id != EventListeners.polyominoSelected.id && p2.id != EventListeners.polyominoSelected.id)) {
                let m1 = p1.coord.length;
                let m2 = p2.coord.length;

                let f1 = m2 / (m1 + m2);
                if (f1 < 0.5) f1 += 0.25;
                let f2 = m1 / (m1 + m2);
                if (f2 < 0.5) f2 += 0.25;

                f1 = Math.round(f1);
                f2 = Math.round(f2);

                let stepSize = 1;
                let del1 = parametricEquationOfMinos(p1, p2, stepSize);
                let del2 = parametricEquationOfMinos(p2, p1, stepSize);

                if ((f1 == 1 || p2.itr >= 30)) {
                    if (areOverlappingSpace(p1, del1.deltaX, del1.deltaY, EventListeners.polyominoDragged) && !EventListeners.isMouseStill())
                        adjustOverlapping(pair.id_1, pair.id_2, true);
                    else
                        translatePolyomino(p1, del1.deltaX, del1.deltaY);
                }

                if ((f2 == 1 || p1.itr >= 30)) {
                    if (areOverlappingSpace(p2, del2.deltaX, del2.deltaY, EventListeners.polyominoDragged) && !EventListeners.isMouseStill())
                        adjustOverlapping(pair.id_1, pair.id_2, true);
                    else
                        translatePolyomino(p2, del2.deltaX, del2.deltaY);
                }
            } else {
                if (EventListeners.polyominoSelected == undefined || p1.id != EventListeners.polyominoSelected.id) {
                    let del = parametricEquationOfMinos(p1, p2, 1);
                    translatePolyomino(p1, del.deltaX, del.deltaY);
                }
                if (EventListeners.polyominoSelected == undefined || p2.id != EventListeners.polyominoSelected.id) {
                    let del = parametricEquationOfMinos(p2, p1, 1);
                    translatePolyomino(p2, del.deltaX, del.deltaY);
                }
            }
        }
    }

    function getUnderlappingObjects() {
        let emptyObj = {};
        generateDelTrigEdges();
        let delEdges = { ...delaunayEdges };
        let underlappingMinosQueue = underlappingMinos.map(obj => {
            let p = obj.poly;
            let c = PolyominoPacking.minoCenterRelativeToPosition(p);
            return {
                "poly": p,
                "set": emptyObj,
                "step": obj.representative.coord.length < getAveragePolyominoWeight() ? 1 : Math.max(1,
                    (1 / (APPLIED_GRADIENT[c.y][c.x] + 0.5)) * ((obj.representative.coord.length - getAveragePolyominoWeight()) / getAveragePolyominoWeight()),
                ),
                "delEdges": delEdges,
                "strength": obj.strength,
                "representative": obj.representative
            }
        });

        underlappingMinos = [];
        return underlappingMinosQueue;
    }

    function virtualDrag(polyomino, start, end, strength = 1) {
        let coordArray = Miscellaneous.calcStraightLine(start, end);
        for (const coord of coordArray) {
            let attractionPoint = createAttractionPoint(coord.x, coord.y);
            adjustUnderLapping(attractionPoint, polyomino, strength);
        }
    }

    /**
     * This function executes underlapping handler on the provided polyominoes in the queue, either till the queue becomes empty or timer is expired.
     * @param {Polyomino[]} queue Array holding polyominoes to be processed.
     * @param {number} execTime timer.
     */
    async function handleUnderLapping(queue, execTime) {
        let start = new Date();
        while (queue.length) {
            if (new Date() - start > execTime) {
                break;
            }
            let obj = queue.shift();

            let poly = obj.poly;
            if (areOverlappingSpace(poly, 0, 0, EventListeners.polyominoSelected)) {
                adjustUnderLapping(poly, obj.representative, obj.strength);
                continue;
            }
            let set = obj.set;
            let step = obj.step;
            let strength = obj.strength;
            set[poly.id - 1] = true;

            let c_poly = PolyominoPacking.minoCenterRelativeToPosition(poly);

            if (obj.delEdges[poly.id - 1])
                for (const pId of obj.delEdges[poly.id - 1]) {
                    if (set[pId]) continue; // If visited before then continue, to avoid infinite cycles.
                    set[pId] = true; // Mark as visited.
                    if (EventListeners.polyominoSelected && pId + 1 == EventListeners.polyominoSelected.id) continue;
                    if (obj.representative.id === (pId + 1)) continue;
                    let p0 = RPP.getPolyById(pId + 1);

                    if (isDistributerMino[pId]) {
                        continue;
                    }
                    let c_p0 = PolyominoPacking.minoCenterRelativeToPosition(p0);


                    let grad = APPLIED_GRADIENT[c_p0.y] && APPLIED_GRADIENT[c_p0.y][c_p0.x] ? APPLIED_GRADIENT[c_p0.y][c_p0.x] : 0;

                    let intersection_p0 = boundingRectangleIntersection(p0, c_p0, c_poly);

                    let intersection_p1 = boundingRectangleIntersection(poly, c_p0, c_poly);

                    if (intersection_p1 == undefined || intersection_p0 == undefined) continue;

                    let appliedForceX = Math.min(1, strength * grad * step);
                    let appliedForceY = Math.min(1, strength * grad * step);

                    let deltaX = Math.round((intersection_p1.x - intersection_p0.x) * appliedForceX);
                    let deltaY = Math.round((intersection_p1.y - intersection_p0.y) * appliedForceY);


                    if (deltaX > 0) deltaX = Math.max(0, Math.floor(deltaX) - (SPACING));
                    if (deltaX < 0) deltaX = Math.min(0, Math.ceil(deltaX) + (SPACING));

                    if (deltaY > 0) deltaY = Math.max(0, Math.floor(deltaY) - (SPACING));
                    if (deltaY < 0) deltaY = Math.min(0, Math.ceil(deltaY) + (SPACING));

                    if (!areOverlappingSpace(p0, deltaX, deltaY, obj.representative)) {
                        translatePolyomino(p0, deltaX, deltaY);
                        if (strength > 0.2) {
                            let end = { "x": c_p0.x + deltaX, "y": c_p0.y + deltaY }
                            virtualDrag(p0, c_p0, end, strength * 0.7)
                        }
                    }
                }
            if (isDistributerMino[poly.id - 1]) {
                isRemovedMino[poly.id - 1] = true;
            }
        }
    }

    async function scheduler(underlappingQueue = [], overlappingQueue = []) {
        if (!overlappingQueue.length) {
            // Get overlapping pairs of objects.
            overlappingQueue = getOverlappingObjects();
        }
        // Run the overlapping handler for 50ms.
        await handleOverlapping(overlappingQueue, 50);

        if (!underlappingQueue.length) {
            // Get underlapping pairs of objects.
            underlappingQueue = getUnderlappingObjects();
        }
        // Run the underlapping handler for 50ms.
        await handleUnderLapping(underlappingQueue, 50);

        setTimeout(() => {
            scheduler(underlappingQueue, overlappingQueue);
        }, 0);
    }

    function periodicCall() {
        setInterval(() => {
            Render.drawLayoutBorder();
        }, 300);
    }

    RPP.generateRandomObjectsAndPack = function(number) {
        NUMBER_OF_POLYOMINOES = number;
        let polys = PolyominoPacking.generateRandomObjects(NUMBER_OF_POLYOMINOES);
        init(polys);
    }
    return RPP;
}());

export { RPP };
