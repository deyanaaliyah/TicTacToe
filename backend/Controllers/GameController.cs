using Microsoft.AspNetCore.Mvc;
using backend.Services;
using backend.Models;
using backend.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GameController : ControllerBase
    {
        private readonly GameService _gameService;
        private readonly IHubContext<GameHub> _hubContext;
        private readonly ILogger<GameController> _logger;

        public GameController(GameService gameService, IHubContext<GameHub> hubContext, ILogger<GameController> logger)
        {
            _gameService = gameService;
            _hubContext = hubContext;
            _logger = logger;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateGame([FromBody] string playerName)
        {
            if (string.IsNullOrEmpty(playerName))
            {
                return BadRequest("Player name is required.");
            }

            var game = _gameService.CreateGame(playerName);

            await _hubContext.Clients.All.SendAsync("GameCreated", game);

            return Ok(game);
        }

        [HttpGet("{gameId}")]
        public IActionResult GetGame(string gameId)
        {
            var game = _gameService.GetGame(gameId);
            if (game == null)
            {
                return NotFound($"Game with ID {gameId} not found.");
            }
            return Ok(game);
        }

        [HttpGet("all")]
        public IActionResult GetAllGames()
        {
            var games = _gameService.GetAllGames();
            return Ok(games);
        }

        [HttpDelete("{gameId}/end")]
        public async Task<IActionResult> EndGame(string gameId)
        {
            var game = _gameService.GetGame(gameId);
            if (game == null)
            {
                return NotFound($"Game with ID {gameId} not found.");
            }

            _gameService.EndGame(gameId);
            await _hubContext.Clients.Group(gameId).SendAsync("GameEnded", gameId);

            return Ok($"Game {gameId} ended.");
        }
    }
}
