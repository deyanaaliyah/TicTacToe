using Microsoft.AspNetCore.SignalR;
using backend.Services;
using System.Threading.Tasks;

namespace backend.Hubs
{
    public class GameHub : Hub
    {
        private readonly GameService _gameService;

        public GameHub(GameService gameService)
        {
            _gameService = gameService;
        }

        public async Task JoinGame(string gameId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, gameId);
            var game = _gameService.GetGame(gameId);
            if (game != null)
            {
                await Clients.Caller.SendAsync("ReceiveGameUpdate", game);
            }
        }

        public async Task MakeMove(string gameId, int index)
        {
            var success = _gameService.MakeMove(gameId, index);
            if (success)
            {
                var updatedGame = _gameService.GetGame(gameId);
                await Clients.Group(gameId).SendAsync("ReceiveGameUpdate", updatedGame);

                if (updatedGame != null && updatedGame.CurrentPlayer == updatedGame.Player2)
                {
                    _gameService.PerformAIMove(updatedGame);
                    await Clients.Group(gameId).SendAsync("ReceiveGameUpdate", updatedGame);
                }
            }
            else
            {
                await Clients.Caller.SendAsync("Error", "Invalid move.");
            }
        }

        public async Task EndGame(string gameId)
        {
            var game = _gameService.GetGame(gameId);
            if (game != null)
            {
                _gameService.EndGame(gameId);
                await Clients.Group(gameId).SendAsync("GameEnded", gameId);
            }
            else
            {
                await Clients.Caller.SendAsync("Error", "Game not found.");
            }
        }
    }
}
