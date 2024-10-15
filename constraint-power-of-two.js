// ==UserScript==
// @name         FPuzzles-Power-Of-Two
// @namespace    http://tampermonkey.net/
// @version      0.1
// @downloadURL  https://github.com/glenfletcher/fpuzzles-scripts/raw/main/constraint-power-of-two.js
// @updateURL    https://github.com/glenfletcher/fpuzzles-scripts/raw/main/constraint-power-of-two.js
// @description  Place Postive Power Of Two Constrain On Board
// @author       Glen Fletcher <mail@glenfletcher.com>
// @match        https://*.f-puzzles.com/*
// @match        https://f-puzzles.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==



(() => {
	'use strict';
	const name = 'Power of Two';
    const id = 'poweroftwo';
    const tooltip = [
        'Cells with green squares must',
        'contain a postive power of two.',
        '',
        'Click on a cell to add an power of two constraint.',
        'Click on an power of two constraint to remove it.',
    ];

	const doShim = () => {

        const {exportPuzzle, importPuzzle, drawConstraints, candidatePossibleInCell, categorizeTools, getPuzzleTitle, compressor} = window;
        const origExportPuzzle = exportPuzzle;
		window.exportPuzzle = function exportPuzzle(includeCandidates) {
			const compressed = origExportPuzzle(includeCandidates);
			const puzzle = JSON.parse(compressor.decompressFromBase64(compressed));

            // Add cosmetic version of constraints for those not using the solver plugin
            const puzzleEntry = puzzle[id];
            if (puzzleEntry && puzzleEntry.length > 0) {
                if (!puzzle.rectangle) {
                    puzzle.rectangle = [];
                }
                for (let instance of puzzleEntry) {
                    puzzle.rectangle.push({
                        cells: [instance.cell],
                        baseC: '#44FF88A0',
                        outlineC: '#008800A0',
                        fontC: '#000000',
                        width: 0.5,
                        height: 0.5,
                        angle: 0,
                        isPowerOfTwoConstraint: true
                    })
                }
            }

			return compressor.compressToBase64(JSON.stringify(puzzle));
		};

		const origImportPuzzle = importPuzzle;
		window.importPuzzle = function importPuzzle(string, clearHistory) {
			const puzzle = JSON.parse(compressor.decompressFromBase64(string));

			// Remove any generated cosmetics
            if (puzzle.rectangle) {
                puzzle.rectangle = puzzle.rectangle.filter(rectangle => !rectangle.isPowerOfTwoConstraint);
                if (puzzle.rectangle.length === 0) {
                    delete puzzle.rectangle;
                }
            }

			string = compressor.compressToBase64(JSON.stringify(puzzle));
			origImportPuzzle(string, clearHistory);
		};

		const origDrawConstraints = drawConstraints;
		window.drawConstraints = function drawConstraints(layer) {

            origDrawConstraints(layer);

			// draw new constrains here
            if (layer === 'Bottom') {
                for (const c of constraints[id] || []) c.show();
            }

		};

        const origCandidatePossibleInCell = candidatePossibleInCell;
        window.candidatePossibleInCell = function(n, cell, options) {
            if (!options) {
                options = {};
            }
            if (!options.bruteForce && cell.value) {
                return cell.value === n;
            }

            if (!origCandidatePossibleInCell(n, cell, options)) {
                return false;
            }

            // custom constrains here
            const constraintsPrime = constraints[id];
            if (constraintsPrime && constraintsPrime.length > 0) {
                for (let prime of constraintsPrime) {
                    if (prime.cell == cell) {
                        return [2,4,8].includes(n)
                    }
                }
            }

            return true;
        }

        window.poweroftwo = function(cells) {
            const {ctx, cellSL, lineWT} = window;
			if(cells && cells.length) this.cell = cells[0];

            this.show = function(){
                ctx.save();
                ctx.translate(this.cell.x + cellSL / 2, this.cell.y + cellSL / 2);

                ctx.lineWidth = lineWT;
                ctx.fillStyle = "#44FF88A0";
                ctx.strokeStyle = "#008800A0";
                ctx.fillRect(-cellSL * 0.25, -cellSL * 0.25, cellSL * 0.5, cellSL * 0.5);
                ctx.strokeRect(-cellSL * 0.25, -cellSL * 0.25, cellSL * 0.5, cellSL * 0.5);

                ctx.restore();
            }
        }

        const origCategorizeTools = categorizeTools;
		window.categorizeTools = () => {
            origCategorizeTools();

            // add custom tools/constrains
            const {toolConstraints, perCellConstraints, oneCellAtATimeTools, tools, negativableConstraints} = window;
			let toolCellIndex = toolConstraints.indexOf('Even');
            toolConstraints.splice(++toolCellIndex, 0, name);
			perCellConstraints.push(name);
			oneCellAtATimeTools.push(name);
			tools.push(name);
			descriptions[name] = tooltip;
        }


         if (window.boolConstraints) {
            let prevButtons = buttons.splice(0, buttons.length);
            window.onload();
            buttons.splice(0, buttons.length);
            for (let i = 0; i < prevButtons.length; i++) {
                buttons.push(prevButtons[i]);
            }
        }

    };
    const checkGlobals = () => [
        'grid',
        'exportPuzzle',
        'importPuzzle',
        'drawConstraints',
        'candidatePossibleInCell',
        'categorizeTools',
        'getPuzzleTitle'
    ].every(key => window[key] !== undefined);
	if(checkGlobals()) {
		doShim();
	}
	else {
		const intervalId = setInterval(() => {
			if(!checkGlobals()) return;
			clearInterval(intervalId);
			doShim();
		}, 16);
	}

})();