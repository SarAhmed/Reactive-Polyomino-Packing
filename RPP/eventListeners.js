import { RPP } from "./RPP.js";

var EventListeners = (function () {
    function EventListeners() { }
    EventListeners.polyominoSelected = undefined;
    EventListeners.polyominoDragged = undefined;

    let canvas2 = document.getElementById("canvas2");
    let mousePressed = false;
    let cellSelected;

    let polyominoHovered = undefined;
    let mousePosition = undefined;
    let NUMBER_OF_COLUMNS = 1;
    let NUMBER_OF_ROWS = 1
    let CELL_HEIGHT_AND_WIDTH = 1;
    let LAYOUT_GRID = [];

    EventListeners.init = function (packing, grid) {
        LAYOUT_GRID = grid;
        let POLYOMINOES = packing.polyominoPacking.grid;
        NUMBER_OF_ROWS = POLYOMINOES.length;
        NUMBER_OF_COLUMNS = POLYOMINOES[0].length;
        CELL_HEIGHT_AND_WIDTH = Math.round(4 * 150 / NUMBER_OF_ROWS);
    }

    function getMousePosition(canvas, event) {
        let rect = canvas.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;

        let xPos = Math.floor(x / CELL_HEIGHT_AND_WIDTH);
        let yPos = Math.floor(y / CELL_HEIGHT_AND_WIDTH);
        return { xPos, yPos };
    }

    canvas2.addEventListener("mousedown", (e) => {
        cellSelected = getMousePosition(canvas2, e);
        let polysExisting = LAYOUT_GRID[cellSelected.yPos][cellSelected.xPos];
        if (!polysExisting || Object.keys(polysExisting).length !== 1) {
            cellSelected = undefined;
            return;
        }
        let polyId = Object.keys(polysExisting)[0];
        if (isNaN(polyId)) return;
        mousePressed = true;
        EventListeners.polyominoSelected = RPP.getPolyById(polyId);
        EventListeners.polyominoDragged = EventListeners.polyominoSelected;
    });

    canvas2.addEventListener("mouseup", () => {
        mouseRelease();
    });

    function mouseRelease() {
        mousePressed = false;
        EventListeners.polyominoSelected = undefined;
        polyominoHovered = undefined;
        cellSelected = undefined;
        EventListeners.polyominoDragged = undefined;
    }

    canvas2.addEventListener("mouseout", () => {
        mouseRelease();
    });

    let lastMouseMove = new Date();
    let lastMouseMoveTrigger = new Date();
    canvas2.addEventListener("mousemove", (e) => {
        lastMouseMoveTrigger = new Date();
        if (lastMouseMoveTrigger - lastMouseMove <= 50) return;
        lastMouseMove = lastMouseMoveTrigger;

        let currCell = mousePosition = getMousePosition(canvas2, e);

        if (!mousePressed ||
            cellSelected == undefined ||
            EventListeners.polyominoSelected == undefined) return;

        let deltaX = currCell.xPos - cellSelected.xPos;
        let deltaY = currCell.yPos - cellSelected.yPos;

        if (deltaX == undefined || deltaY == undefined) {
            EventListeners.polyominoDragged = undefined;
            return;
        }

        EventListeners.polyominoDragged = EventListeners.polyominoSelected;
        cellSelected = currCell;
        RPP.handleDrag(EventListeners.polyominoDragged, deltaX, deltaY);
    });

    EventListeners.isMouseStill = function () {
        return new Date() - lastMouseMoveTrigger >= 100;
    }

    document.addEventListener("keyup", () => {
        mousePressed = false;
        EventListeners.polyominoSelected = undefined;
        cellSelected = undefined;
    });

    let lastKeyDownTime = new Date();
    document.addEventListener("keydown", (event) => {
        let key = event.code;
        if (key == "ArrowUp" || key == "ArrowDown" || key == "ArrowLeft" || key == "ArrowRight") {
            event.preventDefault(); // Prevent browser scrolling.
        }

        // Limit keydown events to one event per 100 millisecond.
        if (new Date() - lastKeyDownTime < 100) return;
        lastKeyDownTime = new Date();

        cellSelected = getMousePosition(canvas2, event);

        let polysExisting = LAYOUT_GRID[mousePosition.yPos][mousePosition.xPos];
        if (!polysExisting || Object.keys(polysExisting).length !== 1) {
            cellSelected = undefined;
            return;
        }

        mousePressed = true;
        let polyId = Object.keys(polysExisting)[0];
        polyominoHovered = RPP.getPolyById(polyId);
        if (key == "ArrowUp") {
            RPP.handleEnlarge(polyominoHovered);
        } else if (key == "ArrowDown") {
            RPP.handleShrink(polyominoHovered);
        } else if (key == "ArrowLeft") {
            RPP.handleRotateAntiClockwise(polyominoHovered);
        } else if (key == "ArrowRight") {
            RPP.handleRotateClockwise(polyominoHovered);
        }
    });

    return EventListeners;
})();

export { EventListeners };
