import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import signalService from "../services/SignalService";
import { ToastContainer, toast } from "react-toastify";

const Lobby = () => {
  const [playerName, setPlayerName] = useState("");
  const [games, setGames] = useState([]);
  const navigate = useNavigate();

  const fetchGames = async () => {
    try {
      const response = await fetch("http://localhost:5130/api/Game/all");
      if (!response.ok) throw new Error("Failed to fetch games");
      const gamesData = await response.json();
      setGames(gamesData);
    } catch (error) {
      console.error("Error fetching games:", error);
      toast.error("Error fetching games.");
    }
  };

  const createGame = async () => {
    if (!playerName) return;
    try {
      const response = await fetch("http://localhost:5130/api/Game/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(playerName),
      });

      if (!response.ok) {
        throw new Error("Failed to create game");
      }

      const game = await response.json();
      localStorage.setItem("gameId", game.id);
      localStorage.setItem("playerName", playerName);
      localStorage.setItem(
        "currentPlayer",
        JSON.stringify(game.currentPlayer.name)
      );

      await signalService.startConnection();
      navigate(`/game/${game.id}`);
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("Error creating game.");
    }
  };

  useEffect(() => {
    fetchGames();

    signalService.startConnection().then(() => {
      signalService.setGameCreatedCallback((newGame) => {
        setGames((prevGames) => [...prevGames, newGame]);
      });
    });
  }, []);

  return (
    <div className="lobby-container">
      <div className="name-input-con">
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="name-input"
        />
        <button
          onClick={createGame}
          disabled={!playerName}
          className="start-game-btn"
        >
          Go
        </button>
      </div>
      <div className="games-list">
        {games.length === 0 ? (
          <p>No games available</p>
        ) : (
          <table className="game-table">
            <thead>
              <tr>
                <th>Created By</th>
                <th>Current Turn</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game.id}>
                  <td>{game.player1.name}</td>
                  <td>
                    {game.currentPlayer ? game.currentPlayer.name : "N/A"}
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        localStorage.setItem("gameId", game.id);
                        localStorage.setItem("playerName", playerName);
                        localStorage.setItem(
                          "currentPlayer",
                          JSON.stringify(game.currentPlayer?.name)
                        );
                        navigate(`/game/${game.id}`);
                      }}
                      className="join-btn"
                    >
                      Join
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default Lobby;
