using System;
using System.Linq;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.SignalR;
using backend.Models;
using backend.Hubs;

namespace backend.Services
{
    public class GameService
    {
        private readonly Dictionary<string, Game> _games = new();
        private static readonly Random _random = new();
        private readonly IHubContext<GameHub> _hubContext;
        private readonly ILogger<GameService> _logger;

        public GameService(ILogger<GameService> logger, IHubContext<GameHub> hubContext)
        {
            _logger = logger;
            _hubContext = hubContext;
        }

        private static readonly int[][] WinningCombinations = new int[][]
        {
            new int[] { 0, 1, 2 }, new int[] { 3, 4, 5 }, new int[] { 6, 7, 8 }, // Rows
            new int[] { 0, 3, 6 }, new int[] { 1, 4, 7 }, new int[] { 2, 5, 8 }, // Columns
            new int[] { 0, 4, 8 }, new int[] { 2, 4, 6 }  // Diagonals
        };

        // --------------- CRUD ---------------
        public Game CreateGame(string playerName)
        {
            var gameId = Guid.NewGuid().ToString();
            var game = new Game(gameId, new Player(playerName, "X"));

            _games.Add(gameId, game);
            _logger.LogInformation($"Game created by: {playerName}\nGame ID: {gameId}");

            return game;
        }

        public Game? GetGame(string gameId)
        {
            if (_games.ContainsKey(gameId))
            {
                _logger.LogInformation($"Game found: {gameId}");
                return _games[gameId];
            }

            _logger.LogWarning($"Game with ID {gameId} not found");
            return null;
        }

        public List<Game> GetAllGames()
        {
            return _games.Values.ToList();
        }

        public void EndGame(string gameId)
        {
            try
            {
                var gameToBeRemoved = _games.Values.FirstOrDefault(x => x.Id == gameId);
                if (gameToBeRemoved != null)
                {
                    _games.Remove(gameId);
                    _logger.LogInformation($"Game {gameId} ended and removed");
                }
                else
                {
                    _logger.LogWarning($"Attempted to remove non-existent game {gameId}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error ending game with ID {gameId}");
            }
        }

        // --------------- Game Logic ---------------
        public bool MakeMove(string gameId, int index)
        {
            var game = _games.GetValueOrDefault(gameId);
            if (game != null && game.Winner != null)
            {
                _logger.LogInformation("Game already over. No move made.");
                return false;
            }

            // Make the player's move
            game.Board.Cells[index] = game.CurrentPlayer.Mark;

            // Check for winner or tie
            if (CheckWinner(game.Board.Cells, game.CurrentPlayer.Mark))
            {
                game.Winner = game.CurrentPlayer;
            }
            else if (IsTie(game))
            {
                game.Winner = new Player("Tie", "-");
            }
            else
            {
                game.CurrentPlayer = game.CurrentPlayer == game.Player1 ? game.Player2 : game.Player1;
            }

            // Update the game state
            _hubContext.Clients.Group(game.Id).SendAsync("ReceiveGameUpdate", game);

            // If it's AI's turn, perform AI move
            if (game.CurrentPlayer == game.Player2 && game.Winner == null)
            {
                PerformAIMove(game);
            }

            return true;
        }

        public void PerformAIMove(Game game)
        {
            int randomDelayTime = _random.Next(1300, 3500);
            Task.Delay(randomDelayTime).Wait();

            var emptyCells = game.Board.Cells
                .Select((value, index) => new { value, index })
                .Where(cell => string.IsNullOrEmpty(cell.value))
                .Select(cell => cell.index)
                .ToList();

            if (emptyCells.Any())
            {
                // Try to win or block opponent
                int? aiMove = FindBestMove(game.Board.Cells, game.Player2.Mark);
                if (aiMove == null)
                {
                    aiMove = FindBestMove(game.Board.Cells, game.Player1.Mark); // Block opponent
                }
                if (aiMove == null)
                {
                    aiMove = emptyCells[_random.Next(emptyCells.Count)]; // Random move if no better move
                }

                game.Board.Cells[aiMove.Value] = game.Player2.Mark;
            }

            // Check for winner or tie after AI move
            if (CheckWinner(game.Board.Cells, game.Player2.Mark))
            {
                game.Winner = game.Player2;
                _logger.LogInformation("AI won");
            }
            else if (IsTie(game))
            {
                game.Winner = new Player("Tie", "-");
            }
            else
            {
                game.CurrentPlayer = game.Player1;
                _logger.LogInformation($"{game.Player1.Name} won");
            }

            _hubContext.Clients.Group(game.Id).SendAsync("ReceiveGameUpdate", game);
            _logger.LogInformation("Game update sent");
        }

        // Find the best move: either win or block opponent
        private int? FindBestMove(string[] board, string mark)
        {
            foreach (var combination in WinningCombinations)
            {
                int? winningMove = GetWinningMove(board, combination, mark);
                if (winningMove != null)
                {
                    return winningMove;
                }
            }
            return null;
        }

        private int? GetWinningMove(string[] board, int[] combination, string mark)
        {
            var markedCells = combination.Where(i => board[i] == mark).ToArray();
            if (markedCells.Length == 2) // If two marks are in the combination, the third cell is the winning move
            {
                var emptyCells = combination.Where(i => string.IsNullOrEmpty(board[i])).ToList();
                if (emptyCells.Count == 1)
                {
                    return emptyCells.First(); // Return the empty cell in the combination
                }
            }
            return null;
        }

        private bool CheckWinner(string[] board, string mark)
        {
            return WinningCombinations.Any(comb =>
                board[comb[0]] == mark && board[comb[1]] == mark && board[comb[2]] == mark
            );
        }

        public bool IsTie(Game game)
        {
            bool isTie = game.Board.Cells.All(cell => !string.IsNullOrEmpty(cell)) && game.Winner == null;
            if (isTie)
            {
                _logger.LogInformation("Game ended in a tie");
            }
            return isTie;
        }
    }
}
