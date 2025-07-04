# Boggle Game

This project is a web-based implementation of the classic word search game, Boggle. It is developed using vanilla JavaScript, HTML, and CSS, and features multiple gameplay modes, including a sophisticated AI opponent. The application is designed to run in any modern web browser and demonstrates the use of advanced data structures and search algorithms for game logic.

## Description

Boggle is a game where players attempt to find as many words as possible from a grid of random letters within a set time limit. Words can be formed from adjacent letters, moving in any direction (horizontally, vertically, or diagonally).

This implementation provides a clean, interactive user interface and a robust backend logic to handle game state, word validation, and scoring. A key feature is the intelligent AI, which uses a Trie data structure and a Depth-First Search (DFS) algorithm to efficiently find all possible words on the board, providing a challenging opponent for the human player.

***

## Features

* **Multiple Game Modes**:
    * **Player vs. Player (PvP)**: Two human players compete on the same device.
    * **AI vs. Player**: A human player competes against an intelligent AI opponent.
    * **AI vs. AI**: A simulation where two AI players compete against each other, useful for observing the algorithm's performance.
* **Dynamic Board Generation**: A 4x4 Boggle board is randomly generated for each new game, using a letter distribution model based on the standard Boggle dice.
* **Efficient Word Validation**: A **Trie** data structure is constructed from the provided wordlist, allowing for near-instantaneous validation of words and prefixes as they are formed.
* **Intelligent AI Opponent**: The AI utilizes a **Depth-First Search (DFS)** algorithm to traverse the game board and the Trie simultaneously, identifying all valid words. It then selects from this list to simulate gameplay.
* **Game Analytics**: The application tracks game history and computes performance metrics, such as the most frequently played mode and player improvement trends over time.
* **Customizable Settings**: Users can adjust the game duration before starting.

***

## Technologies Used

* **HTML5**: For the structure and layout of the game interface.
* **CSS3**: For styling, animations, and responsive design.
* **Vanilla JavaScript (ES6+)**: For all game logic, DOM manipulation, and algorithm implementation.

***

## Getting Started

To run this project, you must serve the files from a local web server. You cannot simply open the `index.html` file directly in your browser because the application uses the `fetch()` API to load the `wordlist.txt`. Modern browsers restrict such requests from local file systems for security reasons (CORS policy).

### Prerequisites

* A modern web browser (e.g., Chrome, Firefox, Safari, Edge).
* A local web server environment.

### Installation and Running

1.  **Clone or download the repository** to your local machine.
2.  **Navigate to the project directory** in your terminal or command prompt.
3.  **Start a local server**. Below are two common methods:

    **Method 1: Using the VS Code Live Server Extension**
    If you are using Visual Studio Code, a popular and simple method is to install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
    * Install the extension from the VS Code Marketplace.
    * Right-click on the `index.html` file in the explorer panel and select "Open with Live Server".

    **Method 2: Using Python's HTTP Server**
    If you have Python installed, you can use its built-in HTTP server.
    * Open a terminal in the project's root directory.
    * For Python 3, run the command:
        ```sh
        python -m http.server
        ```
    * For Python 2, run the command:
        ```sh
        python -m SimpleHTTPServer
        ```
    * Open your web browser and navigate to `http://localhost:8000`.

4.  Once the page loads, upload the `wordlist.txt` file when prompted and begin playing.

***

## How to Play

1.  **Select a Game Mode**: Choose between Player vs. Player, AI vs. Player, or AI vs. AI.
2.  **Set Game Options**: Adjust the game duration if desired.
3.  **Upload Wordlist**: Click the "Upload Wordlist" button and select the provided `wordlist.txt` file.
4.  **Start Game**: Press the "Start Game" button. The timer will begin.
5.  **Find Words**: Click on adjacent letters to form words. The letters must be connected horizontally, vertically, or diagonally. You cannot use the same letter cell more than once in a single word.
6.  **Submit Words**: Once a word is formed, submit it to see if it is valid.
7.  **Scoring**: Points are awarded based on the length of the valid words found.
8.  **Game Over**: When the timer runs out, the final scores are displayed, and a winner is announced.

***

## Code Structure

The project is organized into the following files:

* `index.html`: The main HTML file that defines the user interface for the game.
* `style.css`: Contains all CSS rules for styling the application, including layout, colors, and responsive design.
* `algorithm.js`: Implements the `BoggleAlgorithms` class. This file contains the core logic for board generation, the Trie data structure, and the word-finding algorithms (DFS) used by the AI.
* `game.js`: Implements the `BoggleGame` class. This file acts as the main controller, managing the game state, user interactions, timers, scoring, and communication between the UI and the algorithm module.
* `wordlist.txt`: A comprehensive dictionary file containing valid English words. The game logic uses this file to build the Trie for word validation.

***

## Special Thanks

A special acknowledgment goes to **Wordnik** for providing the comprehensive word list used in this project. The availability of this data was instrumental in creating an effective and challenging game.

***

## License

This project is licensed under the **MIT License**.
