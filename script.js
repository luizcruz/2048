document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.querySelector('.grid-container');
    const tileContainer = document.querySelector('.tile-container');
    const scoreDisplay = document.getElementById('score');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const newGameButton = document.getElementById('new-game-button');
    const tryAgainButton = document.getElementById('try-again-button');
    const gridSize = 4;
    let grid = [];
    let score = 0;
    let isGameOver = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;


    // --- Initialize Game ---
    function initGame() {
        grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
        score = 0;
        isGameOver = false;
        updateScore(0);
        gameOverOverlay.style.display = 'none';
        tileContainer.innerHTML = ''; // Clear existing tiles
        addRandomTile();
        addRandomTile();
        renderGrid();
        setupInput();
    }

    // --- Render Grid ---
    function renderGrid() {
        tileContainer.innerHTML = ''; // Clear previous tiles before rendering new ones
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c] !== 0) {
                    createTileElement(r, c, grid[r][c]);
                }
            }
        }
    }

    // --- Create Tile Element ---
    function createTileElement(row, col, value) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.dataset.value = value; // For CSS styling based on value
        tile.textContent = value;

        // Calculate position based on row and column
        const tileSpacing = 12; // Should match CSS gap + padding/2? Check calculation
        const tileSize = 100; // Should match CSS width/height
        tile.style.top = `${row * (tileSize + tileSpacing)}px`;
        tile.style.left = `${col * (tileSize + tileSpacing)}px`;

        tileContainer.appendChild(tile);
    }


    // --- Input Handling ---
    function setupInput() {
        document.removeEventListener('keydown', handleKeyDown); // Remove previous listener if any
        document.addEventListener('keydown', handleKeyDown);

        // Basic Touch Handling
        gridContainer.removeEventListener('touchstart', handleTouchStart);
        gridContainer.removeEventListener('touchmove', handleTouchMove);
        gridContainer.removeEventListener('touchend', handleTouchEnd);
        gridContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
        gridContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
        gridContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    function handleKeyDown(event) {
        if (isGameOver) return;

        let moved = false;
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                moved = moveUp();
                break;
            case 'ArrowDown':
                 event.preventDefault();
                moved = moveDown();
                break;
            case 'ArrowLeft':
                 event.preventDefault();
                moved = moveLeft();
                break;
            case 'ArrowRight':
                 event.preventDefault();
                moved = moveRight();
                break;
            default:
                return; // Ignore other keys
        }

        if (moved) {
            addRandomTile();
            renderGrid(); // Re-render after move and adding new tile
             if (checkGameOver()) {
                 endGame();
             }
        }
    }

     // --- Touch Input Handlers ---
    function handleTouchStart(event) {
        if (isGameOver) return;
        event.preventDefault(); // Prevent scrolling while swiping on grid
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }

    function handleTouchMove(event) {
         if (isGameOver) return;
        event.preventDefault(); // Prevent scrolling
        touchEndX = event.touches[0].clientX;
        touchEndY = event.touches[0].clientY;
    }

    function handleTouchEnd(event) {
        if (isGameOver) return;
         event.preventDefault();
        handleSwipe();
    }

    function handleSwipe() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const threshold = 50; // Minimum distance for a swipe

        let moved = false;

        // Determine swipe direction (prioritize larger movement)
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > threshold) {
                moved = (deltaX > 0) ? moveRight() : moveLeft();
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > threshold) {
                moved = (deltaY > 0) ? moveDown() : moveUp();
            }
        }

         if (moved) {
            addRandomTile();
            renderGrid();
            if (checkGameOver()) {
                endGame();
            }
        }

        // Reset touch coordinates
        touchStartX = 0;
        touchStartY = 0;
        touchEndX = 0;
        touchEndY = 0;
    }

    // --- Movement Logic ---

    // Helper function to process a single row/column (slide, merge, slide again)
    function processLine(line) {
        let filteredLine = line.filter(num => num !== 0); // Remove zeros
        let newLine = [];
        let lineScore = 0;
        let moved = false;

        // Merge tiles
        for (let i = 0; i < filteredLine.length; i++) {
            if (i + 1 < filteredLine.length && filteredLine[i] === filteredLine[i + 1]) {
                const mergedValue = filteredLine[i] * 2;
                newLine.push(mergedValue);
                lineScore += mergedValue; // Add merged value to score
                i++; // Skip the next tile as it has been merged
                moved = true;
            } else {
                newLine.push(filteredLine[i]);
            }
        }

         // Check if filtering zeros caused movement
         if (newLine.length !== line.length) moved = true;
          // Check if values changed order/merged
          if (!moved) {
             for(let i=0; i<newLine.length; ++i) {
                 if(newLine[i] !== line.filter(n => n !== 0)[i]) {
                      moved = true;
                      break;
                 }
             }
          }


        // Pad with zeros
        while (newLine.length < gridSize) {
            newLine.push(0);
        }


        return { result: newLine, score: lineScore, moved: moved };
    }


    function moveLeft() {
        let boardChanged = false;
        let moveScore = 0;
        for (let r = 0; r < gridSize; r++) {
            const currentLine = grid[r];
            const { result, score: lineScore, moved } = processLine(currentLine);
             if(moved) boardChanged = true;
            grid[r] = result;
            moveScore += lineScore;
        }
         if(boardChanged) updateScore(moveScore);
        return boardChanged;
    }

    function moveRight() {
         let boardChanged = false;
        let moveScore = 0;
        for (let r = 0; r < gridSize; r++) {
            const currentLine = grid[r].slice().reverse(); // Reverse to use processLine (treats as left move)
            const { result, score: lineScore, moved } = processLine(currentLine);
             if(moved) boardChanged = true;
            grid[r] = result.reverse(); // Reverse back
            moveScore += lineScore;
        }
         if(boardChanged) updateScore(moveScore);
        return boardChanged;
    }

    function moveUp() {
         let boardChanged = false;
        let moveScore = 0;
        for (let c = 0; c < gridSize; c++) {
            let currentLine = [];
            for (let r = 0; r < gridSize; r++) { // Extract column
                currentLine.push(grid[r][c]);
            }
            const { result, score: lineScore, moved } = processLine(currentLine);
             if(moved) boardChanged = true;
             for (let r = 0; r < gridSize; r++) { // Place result back into column
                grid[r][c] = result[r];
            }
            moveScore += lineScore;
        }
         if(boardChanged) updateScore(moveScore);
        return boardChanged;
    }

    function moveDown() {
         let boardChanged = false;
        let moveScore = 0;
        for (let c = 0; c < gridSize; c++) {
            let currentLine = [];
            for (let r = 0; r < gridSize; r++) { // Extract column
                currentLine.push(grid[r][c]);
            }
             const reversedLine = currentLine.slice().reverse(); // Reverse to use processLine
            const { result, score: lineScore, moved } = processLine(reversedLine);
             if(moved) boardChanged = true;
             const finalResult = result.reverse(); // Reverse back
             for (let r = 0; r < gridSize; r++) { // Place result back into column
                grid[r][c] = finalResult[r];
            }
            moveScore += lineScore;
        }
         if(boardChanged) updateScore(moveScore);
        return boardChanged;
    }


    // --- Add Random Tile ---
    function addRandomTile() {
        let emptyCells = [];
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }

        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            // Add a 2 most of the time, occasionally a 4
            grid[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
            // Don't call renderGrid here, let the main move function handle it
            // Optional: Animate the appearance of the new tile separately
            // createTileElement(randomCell.r, randomCell.c, grid[randomCell.r][randomCell.c]); // Render just the new tile? Needs adjustment
        }
    }

    // --- Score ---
    function updateScore(addedScore) {
        score += addedScore;
        scoreDisplay.textContent = score;
    }

    // --- Game Over Logic ---
    function checkGameOver() {
        // 1. Check for empty cells
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c] === 0) {
                    return false; // Game not over if there's an empty cell
                }
            }
        }

        // 2. Check for possible merges (if no empty cells)
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                // Check merge right
                if (c + 1 < gridSize && grid[r][c] === grid[r][c + 1]) {
                    return false;
                }
                // Check merge down
                if (r + 1 < gridSize && grid[r][c] === grid[r + 1][c]) {
                    return false;
                }
            }
        }

        // If no empty cells and no possible merges, game is over
        return true;
    }

    function endGame() {
        isGameOver = true;
        gameOverOverlay.style.display = 'flex'; // Show the overlay
         document.removeEventListener('keydown', handleKeyDown); // Stop listening to keys
         gridContainer.removeEventListener('touchstart', handleTouchStart);
         gridContainer.removeEventListener('touchmove', handleTouchMove);
         gridContainer.removeEventListener('touchend', handleTouchEnd);
    }

    // --- Event Listeners for Buttons ---
    newGameButton.addEventListener('click', initGame);
    tryAgainButton.addEventListener('click', initGame);


    // --- Start the game initially ---
    initGame();
});