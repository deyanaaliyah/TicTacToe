namespace backend.Models
{
    public class Game
    {
        public string Id { get; set; }
        public Player Player1 { get; set; }
        public Player Player2 { get; set; }
        public Player CurrentPlayer { get; set; }
        public Board Board { get; set; }
        public Player Winner { get; set; } = null!;


        public Game(string id, Player player1)
        {
            Id = id;
            Player1 = player1;
            Player2 = new Player("Computer", "O");
            CurrentPlayer = player1;
            Board = new Board();
        }
    }
}
