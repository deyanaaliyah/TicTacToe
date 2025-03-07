# Tic Tac Toe Game using AI!

This project implements a real-time multiplayer Tic Tac Toe game using React, SignalR for communication, and a .NET Core backend. Players can create (and soon join games), and the state of the game is synchronized across all participants in real time.

A Tic Tac Toe board consists of a 9-index array, where each position represents a possible move. The AI scans the board, evaluates threats and opportunities, and strategically places its move to maximize its chances of winning. Using a combination of pattern recognition and decision-making, it ensures that every game is a real challenge!

<p align="center">
  <img src="/frontend/public/Csharp_Logo.png" alt="CSharp" height="120">
  <img src="/frontend/public/logo192.png" alt="React" height="100">
  <img src="/frontend/public/signalR_Logo.png" alt="SignalR" height="100">
</p>

## Installation
### Backend
Clone the repository:
```bash
git clone https://github.com/deyanaaliyah/TicTacToe.git
cd backend
```
Restore the NuGet packages:
```bash
dotnet restore
```
Run the application:
```bash
dotnet run
```
The backend will be available on http://localhost:5130.

### Frontend
Go back to ```/TicTacToe``` and install dependencies 
```bash
cd ..
cd frontend
npm install
```

Run the development server:
```bash
npm start
```
This will start the React app on http://localhost:3000.
Open the app in your browser and enter your player name to either create a new game or join an existing one.
Development

## API Endpoints
- ```POST```&emsp;&emsp;```/api/Game/create```: Creates a new game.
- ```POST```&emsp;&emsp;```/api/Game/{gameId}/join```: Joins an existing game.
- ```GET```&emsp;&emsp;  ```/api/Game/{gameId}```: Fetches the current state of a game.
- ```DELETE```&emsp;```/api/Game/{gameId}/end```: Ends the current game.
  
## SignalR Integration
The backend uses SignalR to facilitate real-time communication between the frontend and backend. This allows game state updates, such as moves or player changes, to be broadcast instantly to all connected clients.


SignalR is used for bi-directional communication between the frontend and backend. Here’s an overview of the SignalR functionality:

1. Game Creation: When a player creates a game, a SignalR event (```GameCreated```) is triggered to notify all clients.
2. Game State Updates: Whenever a player makes a move, the game state is updated, and all connected clients are notified using the ```ReceiveGameUpdate``` event.
3. Game Ended: When a game ends, a ```GameEnded``` event is triggered to notify all participants.
4. Let a second player join the game: under construction :/

To ensure a smooth gameplay experience, the frontend will listen for these events and update the game state in real time.

## AI
The AI looks for patterns to win or block the opponent. It follows these steps:

1. **Finds Winning Moves:** The AI checks if it has two markers in a row, column, or diagonal with an empty space to win. If so, it places its marker in the empty spot.
2. **Blocks the Opponent:** If the opponent has two markers in a row, column, or diagonal, the AI will block the third spot to stop them from winning.
3. **Chooses the Best Move:** If there’s no immediate win or block, the AI picks the best available move, like taking a corner or center spot to set up future opportunities.
   
For example, if the board looks like this:

<img src="/frontend/public/Example.png" alt="Tic Tac Toe Example" height="300">

The AI will choose to place an "X" in the bottom-right corner (position 9/green) to win the game.
