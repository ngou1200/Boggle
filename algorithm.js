class BoggleAlgorithms {
    constructor() {
        this.wordTrie = null;
        this.boardSize = 4;
        this.board = [];
        this.directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
    }

    // Trie data structure for efficient word lookup
    buildTrie(words) {
        const trie = {};
        
        for (const word of words) {
            if (word.length < 3) continue; // Boggle minimum word length
            
            let node = trie;
            for (const char of word.toLowerCase()) {
                if (!node[char]) {
                    node[char] = {};
                }
                node = node[char];
            }
            node.isEnd = true;
            node.word = word.toLowerCase();
        }
        
        this.wordTrie = trie;
        return trie;
    }

    // Generate random Boggle board with weighted letter distribution
    generateBoard(size = 4) {
        this.boardSize = size;
        this.board = [];
        
        // Standard Boggle dice distribution for 4x4
        const standardDice = [
            'AAEEGN', 'ABBJOO', 'ACHOPS', 'AFFKPS',
            'AOOTTW', 'CIMOTU', 'DEILRX', 'DELRVY',
            'DISTTY', 'EEGHNW', 'EEINSU', 'EHRTVW',
            'EIOSST', 'ELRTTY', 'HIMNQU', 'HLNNRZ'
        ];
        
        // Extended letter distribution for larger boards
        const extendedLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const letterFrequency = {
            'A': 8, 'B': 2, 'C': 3, 'D': 4, 'E': 12, 'F': 2, 'G': 3, 'H': 2,
            'I': 9, 'J': 1, 'K': 1, 'L': 4, 'M': 2, 'N': 6, 'O': 8, 'P': 2,
            'Q': 1, 'R': 6, 'S': 4, 'T': 6, 'U': 4, 'V': 2, 'W': 2, 'X': 1,
            'Y': 2, 'Z': 1
        };
        
        if (size === 4) {
            // Use standard Boggle dice for 4x4
            const shuffledDice = [...standardDice].sort(() => Math.random() - 0.5);
            for (let i = 0; i < size; i++) {
                this.board[i] = [];
                for (let j = 0; j < size; j++) {
                    const dice = shuffledDice[i * size + j];
                    const letter = dice[Math.floor(Math.random() * dice.length)];
                    this.board[i][j] = letter === 'Q' ? 'QU' : letter;
                }
            }
        } else {
            // Use weighted random distribution for larger boards
            const weightedLetters = [];
            for (const [letter, weight] of Object.entries(letterFrequency)) {
                for (let i = 0; i < weight; i++) {
                    weightedLetters.push(letter === 'Q' ? 'QU' : letter);
                }
            }
            
            for (let i = 0; i < size; i++) {
                this.board[i] = [];
                for (let j = 0; j < size; j++) {
                    const randomIndex = Math.floor(Math.random() * weightedLetters.length);
                    this.board[i][j] = weightedLetters[randomIndex];
                }
            }
        }
        
        return this.board;
    }

    // Validate if a word exists on the board using DFS
    validateWord(word, board = this.board) {
        if (!word || word.length < 3) return false;
        
        const upperWord = word.toUpperCase();
        const visited = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(false));
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.dfsValidate(board, i, j, upperWord, 0, visited)) {
                    return true;
                }
            }
        }
        return false;
    }

    dfsValidate(board, row, col, word, index, visited) {
        if (index === word.length) return true;
        
        if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize || 
            visited[row][col]) return false;
        
        const cellValue = board[row][col];
        const targetChar = word[index];
        
        // Handle QU special case
        if (cellValue === 'QU') {
            if (index + 1 < word.length && word.substr(index, 2) === 'QU') {
                visited[row][col] = true;
                const result = this.dfsValidate(board, row, col, word, index + 2, visited);
                visited[row][col] = false;
                return result;
            }
            return false;
        }
        
        if (cellValue !== targetChar) return false;
        
        visited[row][col] = true;
        
        for (const [dr, dc] of this.directions) {
            if (this.dfsValidate(board, row + dr, col + dc, word, index + 1, visited)) {
                visited[row][col] = false;
                return true;
            }
        }
        
        visited[row][col] = false;
        return false;
    }

    // Find all valid words on the board using advanced DFS with Trie
    findAllWords(board = this.board, minLength = 3) {
        if (!this.wordTrie) return [];
        
        const validWords = new Set();
        const visited = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(false));
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                this.dfsTrieSearch(board, i, j, this.wordTrie, '', visited, validWords, minLength);
            }
        }
        
        return Array.from(validWords).sort();
    }

    dfsTrieSearch(board, row, col, trieNode, currentWord, visited, validWords, minLength) {
        if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize || 
            visited[row][col]) return;
        
        const cellValue = board[row][col].toLowerCase();
        
        // Handle QU special case
        if (cellValue === 'qu') {
            if (!trieNode['q'] || !trieNode['q']['u']) return;
            
            const newWord = currentWord + 'qu';
            const newNode = trieNode['q']['u'];
            
            if (newNode.isEnd && newWord.length >= minLength) {
                validWords.add(newWord);
            }
            
            visited[row][col] = true;
            for (const [dr, dc] of this.directions) {
                this.dfsTrieSearch(board, row + dr, col + dc, newNode, newWord, visited, validWords, minLength);
            }
            visited[row][col] = false;
            return;
        }
        
        // Regular letter processing
        if (!trieNode[cellValue]) return;
        
        const newWord = currentWord + cellValue;
        const newNode = trieNode[cellValue];
        
        if (newNode.isEnd && newWord.length >= minLength) {
            validWords.add(newWord);
        }
        
        visited[row][col] = true;
        
        for (const [dr, dc] of this.directions) {
            this.dfsTrieSearch(board, row + dr, col + dc, newNode, newWord, visited, validWords, minLength);
        }
        
        visited[row][col] = false;
    }

    // Calculate word score based on Boggle rules
    calculateWordScore(word) {
        const length = word.length;
        if (length < 3) return 0;
        if (length === 3 || length === 4) return 1;
        if (length === 5) return 2;
        if (length === 6) return 3;
        if (length === 7) return 5;
        return 11; // 8+ letters
    }

    // AI Strategy: Greedy approach with word value optimization
    getAIMoves(board, foundWords, timeRemaining, difficulty = 'medium') {
        const allWords = this.findAllWords(board);
        const availableWords = allWords.filter(word => !foundWords.includes(word));
        
        if (availableWords.length === 0) return [];
        
        let moves = [];
        
        switch (difficulty) {
            case 'easy':
                moves = this.getEasyAIMoves(availableWords);
                break;
            case 'medium':
                moves = this.getMediumAIMoves(availableWords);
                break;
            case 'hard':
                moves = this.getHardAIMoves(availableWords, timeRemaining);
                break;
        }
        
        return moves;
    }

    getEasyAIMoves(words) {
        // Easy AI: Random selection, prefers shorter words
        const shortWords = words.filter(w => w.length <= 5);
        const targetWords = shortWords.length > 0 ? shortWords : words;
        
        const count = Math.min(3, targetWords.length);
        const selected = [];
        
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * targetWords.length);
            selected.push(targetWords.splice(randomIndex, 1)[0]);
        }
        
        return selected;
    }

    getMediumAIMoves(words) {
        // Medium AI: Balanced approach between word length and frequency
        const scoredWords = words.map(word => ({
            word,
            score: this.calculateWordScore(word),
            length: word.length,
            priority: this.calculateWordScore(word) * (1 + Math.random() * 0.5)
        }));
        
        scoredWords.sort((a, b) => b.priority - a.priority);
        
        const count = Math.min(5, scoredWords.length);
        return scoredWords.slice(0, count).map(item => item.word);
    }

    getHardAIMoves(words, timeRemaining) {
        // Hard AI: Optimal strategy with time management
        const scoredWords = words.map(word => ({
            word,
            score: this.calculateWordScore(word),
            length: word.length,
            difficulty: this.estimateWordDifficulty(word),
            timeValue: this.calculateWordScore(word) / Math.max(1, this.estimateWordDifficulty(word))
        }));
        
        // Sort by time value (score per difficulty unit)
        scoredWords.sort((a, b) => b.timeValue - a.timeValue);
        
        // Adjust strategy based on remaining time
        let targetCount;
        if (timeRemaining > 120) {
            targetCount = Math.min(8, scoredWords.length);
        } else if (timeRemaining > 60) {
            targetCount = Math.min(6, scoredWords.length);
        } else {
            targetCount = Math.min(4, scoredWords.length);
        }
        
        return scoredWords.slice(0, targetCount).map(item => item.word);
    }

    estimateWordDifficulty(word) {
        // Estimate how difficult a word is to find (for AI timing)
        let difficulty = 1;
        
        // Longer words are generally harder to find
        difficulty += Math.max(0, word.length - 4) * 0.5;
        
        // Words with uncommon letters are harder
        const uncommonLetters = ['J', 'Q', 'X', 'Z'];
        for (const letter of word.toUpperCase()) {
            if (uncommonLetters.includes(letter)) {
                difficulty += 1;
            }
        }
        
        // Words with repeated letters might be harder
        const letterCount = {};
        for (const letter of word) {
            letterCount[letter] = (letterCount[letter] || 0) + 1;
        }
        
        for (const count of Object.values(letterCount)) {
            if (count > 1) {
                difficulty += 0.5;
            }
        }
        
        return difficulty;
    }

    // Advanced pathfinding for visual feedback
    findWordPath(word, board = this.board) {
        if (!word || word.length < 3) return null;
        
        const upperWord = word.toUpperCase();
        const visited = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(false));
        const path = [];
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.dfsPath(board, i, j, upperWord, 0, visited, path)) {
                    return path.slice();
                }
            }
        }
        return null;
    }

    dfsPath(board, row, col, word, index, visited, path) {
        if (index === word.length) return true;
        
        if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize || 
            visited[row][col]) return false;
        
        const cellValue = board[row][col];
        const targetChar = word[index];
        
        // Handle QU special case
        if (cellValue === 'QU') {
            if (index + 1 < word.length && word.substr(index, 2) === 'QU') {
                visited[row][col] = true;
                path.push([row, col]);
                
                const result = this.dfsPath(board, row, col, word, index + 2, visited, path);
                
                if (!result) {
                    visited[row][col] = false;
                    path.pop();
                }
                return result;
            }
            return false;
        }
        
        if (cellValue !== targetChar) return false;
        
        visited[row][col] = true;
        path.push([row, col]);
        
        for (const [dr, dc] of this.directions) {
            if (this.dfsPath(board, row + dr, col + dc, word, index + 1, visited, path)) {
                return true;
            }
        }
        
        visited[row][col] = false;
        path.pop();
        return false;
    }

    // Check if word exists in dictionary (Trie lookup)
    isValidWord(word) {
        if (!this.wordTrie || !word || word.length < 3) return false;
        
        let node = this.wordTrie;
        for (const char of word.toLowerCase()) {
            if (!node[char]) return false;
            node = node[char];
        }
        
        return node.isEnd === true;
    }

    // Get word suggestions based on current board state
    getWordSuggestions(prefix, board = this.board, maxSuggestions = 10) {
        if (!this.wordTrie || !prefix) return [];
        
        const suggestions = [];
        const visited = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(false));
        
        // Find all possible starting positions for the prefix
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                this.findSuggestions(board, i, j, prefix.toLowerCase(), 0, this.wordTrie, 
                                   '', visited, suggestions, maxSuggestions);
            }
        }
        
        return [...new Set(suggestions)].sort().slice(0, maxSuggestions);
    }

    findSuggestions(board, row, col, prefix, prefixIndex, trieNode, currentWord, 
                   visited, suggestions, maxSuggestions) {
        if (suggestions.length >= maxSuggestions) return;
        
        if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize || 
            visited[row][col]) return;
        
        const cellValue = board[row][col].toLowerCase();
        
        // Handle QU special case
        if (cellValue === 'qu') {
            if (!trieNode['q'] || !trieNode['q']['u']) return;
            
            const newWord = currentWord + 'qu';
            const newNode = trieNode['q']['u'];
            
            let newPrefixIndex = prefixIndex;
            if (prefixIndex < prefix.length) {
                if (prefix.substr(prefixIndex, 2) === 'qu') {
                    newPrefixIndex += 2;
                } else if (prefix[prefixIndex] === 'q') {
                    newPrefixIndex += 1;
                } else {
                    return;
                }
            }
            
            if (newPrefixIndex >= prefix.length && newNode.isEnd && newWord.length >= 3) {
                suggestions.push(newWord);
            }
            
            visited[row][col] = true;
            for (const [dr, dc] of this.directions) {
                this.findSuggestions(board, row + dr, col + dc, prefix, newPrefixIndex, 
                                   newNode, newWord, visited, suggestions, maxSuggestions);
            }
            visited[row][col] = false;
            return;
        }
        
        // Regular letter processing
        if (!trieNode[cellValue]) return;
        
        const newWord = currentWord + cellValue;
        const newNode = trieNode[cellValue];
        
        let newPrefixIndex = prefixIndex;
        if (prefixIndex < prefix.length) {
            if (prefix[prefixIndex] === cellValue) {
                newPrefixIndex += 1;
            } else {
                return;
            }
        }
        
        if (newPrefixIndex >= prefix.length && newNode.isEnd && newWord.length >= 3) {
            suggestions.push(newWord);
        }
        
        visited[row][col] = true;
        
        for (const [dr, dc] of this.directions) {
            this.findSuggestions(board, row + dr, col + dc, prefix, newPrefixIndex, 
                               newNode, newWord, visited, suggestions, maxSuggestions);
        }
        
        visited[row][col] = false;
    }

    // Board analysis for AI strategy
    analyzeBoardComplexity(board = this.board) {
        const allWords = this.findAllWords(board);
        const totalWords = allWords.length;
        const avgWordLength = allWords.reduce((sum, word) => sum + word.length, 0) / totalWords;
        const totalScore = allWords.reduce((sum, word) => sum + this.calculateWordScore(word), 0);
        
        // Calculate letter frequency
        const letterFreq = {};
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const letter = board[i][j];
                letterFreq[letter] = (letterFreq[letter] || 0) + 1;
            }
        }
        
        return {
            totalWords,
            avgWordLength,
            totalScore,
            letterFreq,
            complexity: this.calculateBoardComplexity(totalWords, avgWordLength, totalScore)
        };
    }

    calculateBoardComplexity(totalWords, avgWordLength, totalScore) {
        // Simple complexity calculation
        const wordDensity = totalWords / (this.boardSize * this.boardSize);
        const lengthFactor = avgWordLength / 5; // Normalized to 5-letter average
        const scoreFactor = totalScore / 100; // Normalized score
        
        return (wordDensity * lengthFactor * scoreFactor) * 10;
    }

    // Get optimal moves for different AI personalities
    getAIPersonalityMoves(board, foundWords, personality = 'balanced') {
        const allWords = this.findAllWords(board);
        const availableWords = allWords.filter(word => !foundWords.includes(word));
        
        switch (personality) {
            case 'aggressive':
                return this.getAggressiveAIMoves(availableWords);
            case 'conservative':
                return this.getConservativeAIMoves(availableWords);
            case 'opportunistic':
                return this.getOpportunisticAIMoves(availableWords);
            default:
                return this.getMediumAIMoves(availableWords);
        }
    }

    getAggressiveAIMoves(words) {
        // Aggressive AI: Goes for high-scoring words first
        const scoredWords = words.map(word => ({
            word,
            score: this.calculateWordScore(word)
        }));
        
        scoredWords.sort((a, b) => b.score - a.score);
        return scoredWords.slice(0, 6).map(item => item.word);
    }

    getConservativeAIMoves(words) {
        // Conservative AI: Focuses on sure wins with shorter words
        const safeWords = words.filter(w => w.length >= 3 && w.length <= 5);
        const targetWords = safeWords.length > 0 ? safeWords : words;
        
        return targetWords.slice(0, 4);
    }

    getOpportunisticAIMoves(words) {
        // Opportunistic AI: Looks for uncommon words that human might miss
        const uncommonWords = words.filter(word => {
            const uncommonLetters = ['J', 'Q', 'X', 'Z'];
            return word.split('').some(letter => uncommonLetters.includes(letter.toUpperCase()));
        });
        
        const regularWords = words.filter(word => !uncommonWords.includes(word));
        
        // Mix of uncommon and regular words
        const mixed = [...uncommonWords.slice(0, 2), ...regularWords.slice(0, 4)];
        return mixed.slice(0, 6);
    }

    // Performance optimization: Precompute word positions
    precomputeWordPositions(board = this.board) {
        const wordPositions = new Map();
        const allWords = this.findAllWords(board);
        
        for (const word of allWords) {
            const path = this.findWordPath(word, board);
            if (path) {
                wordPositions.set(word, path);
            }
        }
        
        return wordPositions;
    }

    // Utility method to shuffle array
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Debug method to print board
    printBoard(board = this.board) {
        console.log('Current Board:');
        for (let i = 0; i < this.boardSize; i++) {
            console.log(board[i].join(' '));
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BoggleAlgorithms;
}