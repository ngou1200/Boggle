class BoggleGame {
    constructor() {
        this.algorithms = new BoggleAlgorithms();
        this.gameState = {
            mode: 'pvp', // 'pvp', 'ai-player', 'ai-ai'
            board: [],
            boardSize: 4,
            timeRemaining: 180,
            gameActive: false,
            words: [],
            
            player1: {
                name: 'Player 1',
                score: 0,
                foundWords: [],
                isAI: false
            },
            player2: {
                name: 'Player 2',
                score: 0,
                foundWords: [],
                isAI: false
            }
        };
        
        this.gameTimer = null;
        this.aiTimers = {};
        this.selectedCells = [];
        this.currentWord = '';
        this.wordPositions = new Map();
        this.gameHistory = [];
        this.performanceMetrics = {
            wordsPerMinute: 0,
            averageWordLength: 0,
            longestWord: '',
            totalWordsFound: 0
        };
        
        this.initializeEventListeners();
        this.loadWordList();
    }

    initializeEventListeners() {
        // Mode selection
        document.getElementById('pvp-mode').addEventListener('click', () => this.setGameMode('pvp'));
        document.getElementById('ai-player-mode').addEventListener('click', () => this.setGameMode('ai-player'));
        document.getElementById('ai-ai-mode').addEventListener('click', () => this.setGameMode('ai-ai'));
        
        // Game setup
        document.getElementById('wordlist-file').addEventListener('change', (e) => this.handleWordlistUpload(e));
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('end-game').addEventListener('click', () => this.endGame());
        document.getElementById('new-game').addEventListener('click', () => this.resetGame());
        
        // Player inputs
        document.getElementById('player1-submit').addEventListener('click', () => this.submitWord(1));
        document.getElementById('player2-submit').addEventListener('click', () => this.submitWord(2));
        
        // Enter key for word submission
        document.getElementById('player1-word').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitWord(1);
        });
        document.getElementById('player2-word').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitWord(2);
        });
        
        // Board interaction
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('board-cell')) {
                this.handleCellClick(e.target);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSelection();
            }
        });
    }

    setGameMode(mode) {
        this.gameState.mode = mode;
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${mode.replace('-', '-')}-mode`).classList.add('active');
        
        // Update player names
        this.gameState.player1.isAI = false;
        this.gameState.player2.isAI = mode === 'ai-player' || mode === 'ai-ai';
        
        if (mode === 'ai-ai') {
            this.gameState.player1.isAI = true;
            this.gameState.player1.name = 'AI Alpha';
            this.gameState.player2.name = 'AI Beta';
        } else if (mode === 'ai-player') {
            this.gameState.player1.name = 'Player';
            this.gameState.player2.name = 'AI Opponent';
        } else {
            this.gameState.player1.name = 'Player 1';
            this.gameState.player2.name = 'Player 2';
        }
    }

    async handleWordlistUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const words = text.split('\n')
                .map(word => word.trim().toLowerCase())
                .filter(word => word.length >= 3 && /^[a-zA-Z]+$/.test(word));
            
            this.gameState.words = words;
            this.algorithms.buildTrie(words);
            
            const statusEl = document.getElementById('wordlist-status');
            statusEl.textContent = `Loaded ${words.length} words`;
            statusEl.className = 'wordlist-status loaded';
            
            document.getElementById('start-game').disabled = false;
            
        } catch (error) {
            console.error('Error loading wordlist:', error);
            const statusEl = document.getElementById('wordlist-status');
            statusEl.textContent = 'Error loading wordlist';
            statusEl.className = 'wordlist-status error';
        }
    }

    startGame() {
        // Get game settings
        const duration = parseInt(document.getElementById('game-duration').value);
        const boardSize = parseInt(document.getElementById('board-size').value);
        
        // Initialize game state
        this.gameState.timeRemaining = duration;
        this.gameState.boardSize = boardSize;
        this.gameState.gameActive = true;
        this.gameState.board = this.algorithms.generateBoard(boardSize);
        
        // Reset players
        this.gameState.player1.score = 0;
        this.gameState.player1.foundWords = [];
        this.gameState.player2.score = 0;
        this.gameState.player2.foundWords = [];
        
        // Reset performance metrics
        this.performanceMetrics = {
            wordsPerMinute: 0,
            averageWordLength: 0,
            longestWord: '',
            totalWordsFound: 0,
            gameStartTime: Date.now()
        };
        
        // Precompute word positions for performance
        this.wordPositions = this.algorithms.precomputeWordPositions(this.gameState.board);
        
        // Switch to game view
        document.getElementById('game-setup').style.display = 'none';
        document.getElementById('game-area').style.display = 'block';
        
        // Update UI
        this.updateGameUI();
        this.createBoardUI();
        
        // Start timer
        this.startTimer();
        
        // Start AI if needed
        if (this.gameState.mode === 'ai-ai') {
            this.startAIPlayers();
        } else if (this.gameState.mode === 'ai-player') {
            this.startAIPlayer(2);
        }
    }

    createBoardUI() {
        const boardEl = document.getElementById('boggle-board');
        boardEl.innerHTML = '';
        boardEl.className = `boggle-board size-${this.gameState.boardSize}`;
        
        for (let i = 0; i < this.gameState.boardSize; i++) {
            for (let j = 0; j < this.gameState.boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                cell.textContent = this.gameState.board[i][j];
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.tabIndex = 0;
                boardEl.appendChild(cell);
            }
        }
    }

    updateGameUI() {
        document.getElementById('game-mode-display').textContent = this.getModeDisplayName();
        document.getElementById('time-display').textContent = this.formatTime(this.gameState.timeRemaining);
        document.getElementById('player1-score').textContent = this.gameState.player1.score;
        document.getElementById('player2-score').textContent = this.gameState.player2.score;
        document.getElementById('player2-title').textContent = this.gameState.player2.name;
        
        // Update word lists
        this.updateWordList(1);
        this.updateWordList(2);
        
        // Show/hide AI thinking indicator
        const aiThinking = document.getElementById('ai-thinking');
        if (this.gameState.player2.isAI) {
            aiThinking.style.display = 'block';
        } else {
            aiThinking.style.display = 'none';
        }
        
        // Disable inputs for AI players
        document.getElementById('player1-input').style.display = 
            this.gameState.player1.isAI ? 'none' : 'block';
        document.getElementById('player2-input').style.display = 
            this.gameState.player2.isAI ? 'none' : 'block';
    }

    updateWordList(playerNum) {
        const player = this.gameState[`player${playerNum}`];
        const wordsEl = document.getElementById(`player${playerNum}-words`);
        
        wordsEl.innerHTML = player.foundWords.map(wordData => {
            const className = wordData.valid ? 'found-word' : 'found-word invalid';
            return `<span class="${className}">${wordData.word} (${wordData.score})</span>`;
        }).join('');
    }

    getModeDisplayName() {
        switch (this.gameState.mode) {
            case 'pvp': return 'Player vs Player';
            case 'ai-player': return 'Player vs AI';
            case 'ai-ai': return 'AI vs AI';
            default: return 'Unknown Mode';
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    startTimer() {
        this.gameTimer = setInterval(() => {
            this.gameState.timeRemaining--;
            document.getElementById('time-display').textContent = 
                this.formatTime(this.gameState.timeRemaining);
            
            if (this.gameState.timeRemaining <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    handleCellClick(cell) {
        if (!this.gameState.gameActive || this.gameState.player1.isAI) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        // Check if this cell can be added to current selection
        if (this.canSelectCell(row, col)) {
            this.selectCell(row, col);
        } else {
            // Start new word if clicking on unconnected cell
            this.clearSelection();
            this.selectCell(row, col);
        }
    }

    canSelectCell(row, col) {
        if (this.selectedCells.length === 0) return true;
        
        // Check if cell is already selected
        if (this.selectedCells.some(([r, c]) => r === row && c === col)) {
            return false;
        }
        
        // Check if cell is adjacent to last selected cell
        const [lastRow, lastCol] = this.selectedCells[this.selectedCells.length - 1];
        const rowDiff = Math.abs(row - lastRow);
        const colDiff = Math.abs(col - lastCol);
        
        return rowDiff <= 1 && colDiff <= 1;
    }

    selectCell(row, col) {
        this.selectedCells.push([row, col]);
        
        // Update visual selection
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (this.selectedCells.length === 1) {
            cell.classList.add('selected');
        } else {
            cell.classList.add('path');
        }
        
        // Update current word
        this.currentWord += this.gameState.board[row][col];
        document.getElementById('current-word').textContent = this.currentWord;
    }

    clearSelection() {
        // Clear visual selection
        document.querySelectorAll('.board-cell.selected, .board-cell.path')
            .forEach(cell => {
                cell.classList.remove('selected', 'path');
            });
        
        // Reset selection state
        this.selectedCells = [];
        this.currentWord = '';
        document.getElementById('current-word').textContent = '';
    }

    submitWord(playerNum) {
        const inputEl = document.getElementById(`player${playerNum}-word`);
        const word = inputEl.value.trim().toLowerCase();
        
        if (!word) return;
        
        this.processWord(word, playerNum);
        inputEl.value = '';
        
        // Clear board selection if it was player 1
        if (playerNum === 1) {
            this.clearSelection();
        }
    }

    processWord(word, playerNum) {
        const player = this.gameState[`player${playerNum}`];
        
        // Check if word was already found by this player
        if (player.foundWords.some(w => w.word === word)) {
            return;
        }
        
        // Validate word
        const isValidWord = this.algorithms.isValidWord(word);
        const isOnBoard = this.algorithms.validateWord(word, this.gameState.board);
        const isValid = isValidWord && isOnBoard;
        
        // Calculate score
        const score = isValid ? this.algorithms.calculateWordScore(word) : 0;
        
        // Add to player's words
        player.foundWords.push({
            word,
            score,
            valid: isValid,
            timestamp: Date.now()
        });
        
        // Update player score
        if (isValid) {
            player.score += score;
            this.updatePerformanceMetrics(word);
        }
        
        // Update UI
        this.updateGameUI();
        
        // Show word path if valid
        if (isValid) {
            this.showWordPath(word);
        }
    }

    updatePerformanceMetrics(word) {
        this.performanceMetrics.totalWordsFound++;
        
        if (word.length > this.performanceMetrics.longestWord.length) {
            this.performanceMetrics.longestWord = word;
        }
        
        // Calculate words per minute
        const elapsedMinutes = (Date.now() - this.performanceMetrics.gameStartTime) / 60000;
        this.performanceMetrics.wordsPerMinute = this.performanceMetrics.totalWordsFound / elapsedMinutes;
        
        // Calculate average word length
        const totalLength = this.gameState.player1.foundWords.concat(this.gameState.player2.foundWords)
            .filter(w => w.valid)
            .reduce((sum, w) => sum + w.word.length, 0);
        this.performanceMetrics.averageWordLength = totalLength / this.performanceMetrics.totalWordsFound;
    }

    showWordPath(word) {
        const path = this.algorithms.findWordPath(word, this.gameState.board);
        if (!path) return;
        
        // Highlight path briefly
        path.forEach(([row, col]) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('path');
        });
        
        setTimeout(() => {
            path.forEach(([row, col]) => {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cell.classList.remove('path');
            });
        }, 1000);
    }

    startAIPlayers() {
        this.startAIPlayer(1);
        this.startAIPlayer(2);
    }

    startAIPlayer(playerNum) {
        const player = this.gameState[`player${playerNum}`];
        if (!player.isAI) return;
        
        // Different AI personalities for variety
        const personalities = ['balanced', 'aggressive', 'conservative', 'opportunistic'];
        const personality = personalities[playerNum - 1] || 'balanced';
        
        this.aiTimers[playerNum] = setTimeout(() => {
            this.executeAIMove(playerNum, personality);
        }, this.getAIThinkTime());
    }

    executeAIMove(playerNum, personality = 'balanced') {
        if (!this.gameState.gameActive) return;
        
        const player = this.gameState[`player${playerNum}`];
        const foundWords = player.foundWords.map(w => w.word);
        
        // Get AI moves based on personality
        const aiMoves = this.algorithms.getAIPersonalityMoves(
            this.gameState.board, 
            foundWords, 
            personality
        );
        
        if (aiMoves.length > 0) {
            // Select a random move from AI suggestions
            const selectedWord = aiMoves[Math.floor(Math.random() * Math.min(3, aiMoves.length))];
            this.processWord(selectedWord, playerNum);
        }
        
        // Schedule next AI move
        if (this.gameState.gameActive && this.gameState.timeRemaining > 0) {
            this.aiTimers[playerNum] = setTimeout(() => {
                this.executeAIMove(playerNum, personality);
            }, this.getAIThinkTime());
        }
    }

    getAIThinkTime() {
        // AI thinks for 2-8 seconds, with some randomness
        const baseTime = 2000 + Math.random() * 6000;
        
        // Adjust based on remaining time
        const timeMultiplier = Math.min(1, this.gameState.timeRemaining / 60);
        
        return baseTime * timeMultiplier;
    }

    endGame() {
        this.gameState.gameActive = false;
        
        // Clear timers
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        // Clear AI timers
        Object.values(this.aiTimers).forEach(timer => clearTimeout(timer));
        this.aiTimers = {};
        
        // Store game history
        this.gameHistory.push({
            timestamp: Date.now(),
            mode: this.gameState.mode,
            boardSize: this.gameState.boardSize,
            player1: { ...this.gameState.player1 },
            player2: { ...this.gameState.player2 },
            metrics: { ...this.performanceMetrics }
        });
        
        // Switch to results view
        document.getElementById('game-area').style.display = 'none';
        document.getElementById('game-results').style.display = 'block';
        
        this.showResults();
    }

    showResults() {
        const player1 = this.gameState.player1;
        const player2 = this.gameState.player2;
        
        // Update final scores
        document.getElementById('final-score1').textContent = player1.score;
        document.getElementById('final-score2').textContent = player2.score;
        document.getElementById('winner-player1').textContent = player1.name;
        document.getElementById('winner-player2').textContent = player2.name;
        
        // Update word counts
        const validWords1 = player1.foundWords.filter(w => w.valid).length;
        const validWords2 = player2.foundWords.filter(w => w.valid).length;
        document.getElementById('word-count1').textContent = `${validWords1} words`;
        document.getElementById('word-count2').textContent = `${validWords2} words`;
        
        // Determine winner
        const winnerEl = document.getElementById('winner-announcement');
        if (player1.score > player2.score) {
            winnerEl.textContent = `${player1.name} Wins!`;
            winnerEl.className = 'winner-announcement player1-wins';
        } else if (player2.score > player1.score) {
            winnerEl.textContent = `${player2.name} Wins!`;
            winnerEl.className = 'winner-announcement player2-wins';
        } else {
            winnerEl.textContent = "It's a Tie!";
            winnerEl.className = 'winner-announcement tie';
        }
        
        // Show game statistics
        this.showGameStats();
        
        // Show missed words analysis
        this.showMissedWords();
    }

    showGameStats() {
        const statsEl = document.getElementById('game-stats');
        const totalWords = this.algorithms.findAllWords(this.gameState.board).length;
        const foundWords = this.gameState.player1.foundWords.concat(this.gameState.player2.foundWords)
            .filter(w => w.valid);
        
        const uniqueWords = [...new Set(foundWords.map(w => w.word))];
        const coverage = ((uniqueWords.length / totalWords) * 100).toFixed(1);
        
        const longestWord = foundWords.reduce((longest, word) => 
            word.word.length > longest.length ? word.word : longest, '');
        
        const highestScoringWord = foundWords.reduce((highest, word) => 
            word.score > highest.score ? word : highest, { word: '', score: 0 });
        
        statsEl.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Total Possible Words</div>
                    <div class="stat-value">${totalWords}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Words Found</div>
                    <div class="stat-value">${uniqueWords.length}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Board Coverage</div>
                    <div class="stat-value">${coverage}%</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Longest Word</div>
                    <div class="stat-value">${longestWord.toUpperCase()}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Highest Scoring</div>
                    <div class="stat-value">${highestScoringWord.word.toUpperCase()} (${highestScoringWord.score})</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Avg Word Length</div>
                    <div class="stat-value">${this.performanceMetrics.averageWordLength.toFixed(1)}</div>
                </div>
            </div>
        `;
    }

    showMissedWords() {
        const allWords = this.algorithms.findAllWords(this.gameState.board);
        const foundWords = this.gameState.player1.foundWords.concat(this.gameState.player2.foundWords)
            .filter(w => w.valid)
            .map(w => w.word);
        
        const missedWords = allWords.filter(word => !foundWords.includes(word));
        
        if (missedWords.length > 0) {
            const missedWordsEl = document.createElement('div');
            missedWordsEl.className = 'missed-words';
            missedWordsEl.innerHTML = `
                <h4>Missed Words (${missedWords.length})</h4>
                <div class="missed-words-list">
                    ${missedWords.slice(0, 20).map(word => `<span class="missed-word">${word.toUpperCase()}</span>`).join('')}
                    ${missedWords.length > 20 ? `<span class="more-words">... and ${missedWords.length - 20} more</span>` : ''}
                </div>
            `;
            document.getElementById('game-stats').appendChild(missedWordsEl);
        }
    }

    resetGame() {
        // Reset game state
        this.gameState.gameActive = false;
        this.gameState.timeRemaining = 180;
        this.gameState.board = [];
        this.gameState.player1.score = 0;
        this.gameState.player1.foundWords = [];
        this.gameState.player2.score = 0;
        this.gameState.player2.foundWords = [];
        
        // Clear timers
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        Object.values(this.aiTimers).forEach(timer => clearTimeout(timer));
        this.aiTimers = {};
        
        // Clear UI state
        this.clearSelection();
        
        // Switch back to setup view
        document.getElementById('game-results').style.display = 'none';
        document.getElementById('game-area').style.display = 'none';
        document.getElementById('game-setup').style.display = 'block';
    }

    async loadWordList() {
        try {
            // Try to load a default word list if available
            const response = await fetch('wordlist.txt');
            if (response.ok) {
                const text = await response.text();
                const words = text.split('\n')
                    .map(word => word.trim().toLowerCase())
                    .filter(word => word.length >= 3 && /^[a-zA-Z]+$/.test(word));
                
                if (words.length > 0) {
                    this.gameState.words = words;
                    this.algorithms.buildTrie(words);
                    
                    const statusEl = document.getElementById('wordlist-status');
                    statusEl.textContent = `Default wordlist loaded (${words.length} words)`;
                    statusEl.className = 'wordlist-status loaded';
                    
                    document.getElementById('start-game').disabled = false;
                }
            }
        } catch (error) {
            console.log('No default wordlist found. Please upload a wordlist file.');
        }
    }

    // Advanced features for enhanced gameplay
    getHint(playerNum) {
        if (!this.gameState.gameActive) return null;
        
        const player = this.gameState[`player${playerNum}`];
        const foundWords = player.foundWords.map(w => w.word);
        const allWords = this.algorithms.findAllWords(this.gameState.board);
        const availableWords = allWords.filter(word => !foundWords.includes(word));
        
        if (availableWords.length === 0) return null;
        
        // Return a hint for a short word
        const shortWords = availableWords.filter(w => w.length <= 5);
        const targetWords = shortWords.length > 0 ? shortWords : availableWords;
        
        const randomWord = targetWords[Math.floor(Math.random() * targetWords.length)];
        return {
            word: randomWord,
            hint: `${randomWord.length} letters, starts with '${randomWord[0].toUpperCase()}'`
        };
    }

    validateCurrentSelection() {
        if (this.selectedCells.length === 0) return false;
        
        const word = this.currentWord.toLowerCase();
        if (word.length < 3) return false;
        
        const isValidWord = this.algorithms.isValidWord(word);
        const isOnBoard = this.algorithms.validateWord(word, this.gameState.board);
        
        return isValidWord && isOnBoard;
    }

    // Save game state for resuming later
    saveGameState() {
        const gameData = {
            gameState: this.gameState,
            performanceMetrics: this.performanceMetrics,
            gameHistory: this.gameHistory,
            timestamp: Date.now()
        };
        
        // In a real application, this would save to localStorage or server
        console.log('Game state saved:', gameData);
        return gameData;
    }

    // Load previously saved game state
    loadGameState(gameData) {
        if (!gameData) return false;
        
        this.gameState = gameData.gameState;
        this.performanceMetrics = gameData.performanceMetrics;
        this.gameHistory = gameData.gameHistory;
        
        // Restore UI state
        this.updateGameUI();
        this.createBoardUI();
        
        // Resume timers if game was active
        if (this.gameState.gameActive) {
            this.startTimer();
            if (this.gameState.mode === 'ai-ai') {
                this.startAIPlayers();
            } else if (this.gameState.mode === 'ai-player') {
                this.startAIPlayer(2);
            }
        }
        
        return true;
    }

    // Get detailed game analytics
    getGameAnalytics() {
        const analytics = {
            totalGames: this.gameHistory.length,
            avgScore: this.gameHistory.reduce((sum, game) => 
                sum + game.player1.score + game.player2.score, 0) / (this.gameHistory.length * 2),
            avgWordsFound: this.gameHistory.reduce((sum, game) => 
                sum + game.player1.foundWords.length + game.player2.foundWords.length, 0) / (this.gameHistory.length * 2),
            favoriteMode: this.getFavoriteMode(),
            bestGame: this.getBestGame(),
            improvementTrend: this.getImprovementTrend()
        };
        
        return analytics;
    }

    getFavoriteMode() {
        const modes = {};
        this.gameHistory.forEach(game => {
            modes[game.mode] = (modes[game.mode] || 0) + 1;
        });
        
        return Object.keys(modes).reduce((a, b) => modes[a] > modes[b] ? a : b, 'pvp');
    }

    getBestGame() {
        return this.gameHistory.reduce((best, game) => {
            const totalScore = game.player1.score + game.player2.score;
            const bestScore = best.player1.score + best.player2.score;
            return totalScore > bestScore ? game : best;
        }, this.gameHistory[0] || {});
    }

    getImprovementTrend() {
        if (this.gameHistory.length < 2) return 0;
        
        const recent = this.gameHistory.slice(-5);
        const older = this.gameHistory.slice(-10, -5);
        
        const recentAvg = recent.reduce((sum, game) => sum + game.player1.score, 0) / recent.length;
        const olderAvg = older.reduce((sum, game) => sum + game.player1.score, 0) / older.length;
        
        return recentAvg - olderAvg;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.boggleGame = new BoggleGame();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BoggleGame;
}