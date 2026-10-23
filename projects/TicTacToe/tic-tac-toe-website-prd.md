# Product Requirements Document: Tic Tac Toe Website

**Status:** Implemented  
**Product:** Browser-based Tic Tac Toe  
**Version:** 1.1  
**Date:** October 8, 2026

## 1. Overview

Build a browser-based Tic Tac Toe website with four board modes: standard 3×3, 4×4, 5×5, and Mega Tic Tac Toe. Each board mode supports local two-player or single-player versus the bot. In Mega mode, a large 3×3 board contains nine smaller standard 3×3 boards. Winning a small board captures that square on the large board for the player who won it.

The experience supports two people sharing one device or one person playing against the bot. The interface should make the current mode, opponent, current player, legal moves, and win or draw state clear.

## 2. Goals

- Let two players start and play each supported board mode easily.
- Support traditional 3×3 and larger 4×4 and 5×5 variants.
- Provide a Mega mode where the outcome of each small 3×3 board contributes to the large 3×3 board.
- Prevent moves in occupied or otherwise unavailable cells.
- Clearly announce wins, captures, draws, and the option to start a new game.
- Offer an in-browser bot opponent for every board mode.
- Allow all 20 visual themes to be displayed in either light or dark appearance.
- Use X and O marks with equal visual dimensions.

## 3. Users and use context

- Two people playing together on a desktop, tablet, or phone.
- One person playing any board mode against the computer opponent.
- A visitor who wants to select a board size and understand its rules without instructions elsewhere.

## 4. Scope

### In scope

- Mode selection: 3×3, 4×4, 5×5, and Mega 3×3-of-3×3.
- Local two-player play, alternating X and O.
- Versus-bot play with X as the human player and O as the bot.
- Win and draw detection for each mode.
- Winner/draw result dialog with a new-game action and an option to return to the board.
- New game and mode switching.
- Responsive, accessible game board and status messages.
- Short, visible rules for each mode.
- Theme customization through 20 named visual presets, each usable in light or dark appearance, with both preferences remembered in the browser.

### Out of scope for the initial release

- Online multiplayer, matchmaking, or accounts.
- Leaderboards, persistent player profiles, or cross-device game saving.
- Timed turns or tournament rules.

## 5. Game rules

### 5.1 Shared rules

- X takes the first turn; players alternate turns.
- A player may mark only an empty, playable cell.
- A completed game rejects further moves until a new game is started.
- In versus-bot mode, the human plays X and the bot plays O; cells are unavailable to the human while the bot is choosing.
- Each mode displays its win condition before or during play.

### 5.2 Standard 3×3

- The board has three rows and three columns.
- A player wins by placing three of their marks in a continuous row, column, or diagonal.
- If all nine cells are filled without a winner, the game is a draw.

### 5.3 4×4

- The board has four rows and four columns.
- A player wins by placing four of their marks in a continuous row, column, or diagonal.
- If the board is full without a winner, the game is a draw.

### 5.4 5×5

- The board has five rows and five columns.
- A player wins by placing five of their marks in a continuous row, column, or diagonal.
- If the board is full without a winner, the game is a draw.

### 5.5 Mega Tic Tac Toe

- The board is a large 3×3 grid. Each of its nine squares contains a playable small 3×3 Tic Tac Toe board.
- Players take turns placing X or O in an empty cell of an available small board.
- When a player wins a small board using the standard 3-in-a-row rule, that entire large-board square is captured by that player. Show the capture clearly (for example, with a large X or O overlay) and make the captured small board unavailable for further moves.
- A small board that fills with no winner is a **drawn board**. It is unavailable for further moves but is not captured by either player.
- A player wins Mega mode by capturing three large-board squares in a continuous row, column, or diagonal.
- If all nine small boards are decided and neither player has captured three large-board squares in a winning line, the game is a draw.
- For the first release, moves may be made in any empty cell of any unresolved small board. A move does not force the next player into a particular small board. (This keeps the mode focused on nested capture rules rather than Ultimate Tic Tac Toe’s directed-move rule.)

## 6. Functional requirements

- **FR-1 Mode selection:** Present four clearly named board choices: 3×3, 4×4, 5×5, and Mega, and opponent choices: 2 Players and VS Bot.
- **FR-2 Start/reset:** Selecting a board or opponent starts a fresh game. Provide a visible “New game” or “Restart” control during play.
- **FR-3 Turn tracking:** Indicate whose turn it is and update after each valid move.
- **FR-4 Move validation:** Ignore or explain attempts to play in an occupied cell, a captured board, or a drawn board.
- **FR-5 Standard win detection:** Detect every horizontal, vertical, and diagonal winning line of the required length in 3×3, 4×4, and 5×5.
- **FR-6 Standard draw detection:** End the game as a draw when no empty cells remain and there is no winner.
- **FR-7 Mega small-board resolution:** Detect a small-board win or draw, record its result, and prevent additional moves in that board.
- **FR-8 Mega capture display:** Show which player captured each large-board square; distinguish drawn small boards from captured boards.
- **FR-9 Mega overall result:** Detect a three-in-a-row capture on the large board, or a draw once all small boards are resolved without a large-board winner.
- **FR-10 Game result:** Announce the winner or draw in a prominent status area. Do not rely on color alone to communicate results.
- **FR-11 Rules help:** Make the win condition and Mega rules accessible from the game screen.
- **FR-12 Bot opponent:** In VS Bot mode, make legal O moves automatically in every board mode. The 3×3 bot uses minimax; larger and Mega modes use immediate-win/block tactics with a positional fallback.
- **FR-13 Result dialog:** Show a modal result dialog when a game ends, identify the winner or draw, and offer New game and Back to board actions.
- **FR-14 Appearance:** Allow the current theme to switch between light and dark appearance without changing its accent palette; persist both preferences locally.
- **FR-15 Mark sizing:** Render X and O with matching view boxes and stroke weights so their visible marks have equal dimensions.

## 7. Interface and content requirements

- The home/game screen includes the game title, mode selector, board, turn indicator, game result, and restart control.
- The active player’s turn is visible without scrolling on common mobile screens.
- The selected opponent is clearly identified, and the bot's thinking turn is announced.
- In Mega mode, the nine small boards remain visually grouped within their large-board positions.
- Captured and drawn small boards have distinct, understandable visual states.
- Winning lines are highlighted after a win while preserving readable X and O marks.
- A win or draw opens a result dialog; starting a new game closes it, resets the board, and gives the first move to X.
- The appearance toggle works independently of the selected theme, including all 20 presets.
- Any colors used to distinguish players are paired with the X/O symbols and accessible contrast.

## 8. Non-functional requirements

- **NFR-1 Responsive:** Usable on phone, tablet, and desktop widths without horizontal page scrolling.
- **NFR-2 Keyboard support:** All mode controls and cells can be reached and operated using a keyboard.
- **NFR-3 Assistive technology:** Board cells expose understandable labels and states, including row/column, mark, and availability; turn and result changes are announced to screen readers.
- **NFR-4 Feedback:** Valid moves and game-state changes appear promptly without page reload.
- **NFR-5 Robustness:** Rapid repeated input cannot place multiple marks in one cell or change a completed game.
- **NFR-6 Static operation:** The initial release can run as a client-side website without a server account or database.

## 9. Acceptance criteria

- A player can select each of the four board modes and either opponent mode.
- In 3×3, 4×4, and 5×5, the game awards a win for the specified number of marks in every valid row, column, or diagonal.
- Each standard mode declares a draw when the board fills with no winner.
- In Mega mode, winning a small board captures its corresponding large-board square and locks that small board.
- In Mega mode, a drawn small board is locked and visually distinct from a player-captured board.
- A player wins Mega mode by capturing a row, column, or diagonal of three large-board squares.
- Mega mode declares a draw when all nine small boards are resolved and neither player has a winning large-board line.
- Invalid moves do not alter the board or player turn.
- Restarting clears the board and begins with X; switching modes starts a fresh board for the selected mode.
- Game outcome, current player, and board state are understandable without depending on color alone.
- Each bot mode makes only legal moves; the human cannot place a mark during the bot's turn.
- A terminal result opens a result dialog with working New game and Back to board controls.
- Every theme can switch between light and dark appearances and both selections persist after reload.
- X and O use the same view box, nominal size, and stroke weight.

## 10. Assumptions and open choices

- In VS Bot mode, the human plays X and the bot plays O; no difficulty selector is offered.
- The 3×3 bot is unbeatable using minimax. Larger boards and Mega use tactical move/block heuristics rather than exhaustive search.
- Larger 4×4 and 5×5 boards require four and five in a row respectively, including diagonals.
- Mega mode uses free board selection: the next player may choose any unresolved small board. If directed moves are desired later, add them as a separate rule and update the interface and acceptance criteria.
- A drawn small board contributes no mark to the large board.
- Player names, sound, and animations are optional enhancements, not launch requirements. Scores are kept for the current page session only; player profiles and cross-device score persistence are out of scope.

## 11. Theme customization

The launch experience includes a theme picker with 20 presets: Classic, Wooden, Snow, Bloom, Minecraft, Ocean, Sunset, Midnight, Retro, Candy, Forest, Lavender, Desert, Neon, Cherry, Slate, Paper, Aurora, Pumpkin, and Galaxy. Every preset supports light and dark appearance. Theme and appearance are persisted locally in the browser. If browser storage is unavailable, preferences still apply for the current visit.
