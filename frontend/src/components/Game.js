import React, { useState, useEffect, useCallback } from "react"; // Import useCallback
import { useNavigate, useParams } from "react-router-dom";
import signalService from "../services/SignalService";
import { ToastContainer, toast } from "react-toastify";
import "../App.css";
import Board from "./Board";
import { checkWinner } from "../utils/gameLogic";

const Game = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameStatus, setGameStatus] = useState("Waiting for players...");
  const [winningPattern, setWinningPattern] = useState([]);
  const { id } = useParams();
  const navigate = useNavigate();
  const gameId = id;

  const updateGameState = useCallback(
    (updatedGameData) => {
      setBoard(updatedGameData.board.cells);
      setCurrentPlayer(updatedGameData.currentPlayer);
      localStorage.setItem("currentPlayer", updatedGameData.currentPlayer.name);

      const winnerData = checkWinner(updatedGameData.board.cells);
      if (winnerData && !gameOver) {
        localStorage.setItem("winner", updatedGameData.winner.name);
        setGameOver(true);
        setGameStatus(`${updatedGameData.winner.name} wins!`);
        setWinningPattern(winnerData.pattern);
      } else if (
        winnerData === null &&
        updatedGameData.board.cells.every((cell) => cell !== null)
      ) {
        setGameStatus("It's a tie!");
        setGameOver(true);
      } else {
        setGameStatus(
          updatedGameData.currentPlayer
            ? `${updatedGameData.currentPlayer.name}'s turn`
            : "Waiting for player..."
        );
      }
    },
    [gameOver]
  ); // Dependency array includes gameOver, since it's used in the updateGameState function

  useEffect(() => {
    if (!id) {
      toast.error("Game ID is missing.");
      navigate("/");
      return;
    }

    const playerName = localStorage.getItem("playerName");
    const storedCurrentPlayer = JSON.stringify(
      localStorage.getItem("currentPlayer")
    );

    if (!playerName || !storedCurrentPlayer) {
      toast.error("Game not found or invalid player.");
      navigate("/");
    } else {
      setCurrentPlayer(storedCurrentPlayer);
      fetchGame(id);

      signalService.startConnection().then(() => {
        signalService.send("JoinGame", { gameId: id });
        signalService.on("ReceiveGameUpdate", updateGameState); // Using memoized updateGameState
        signalService.on("GameEnded", (endedGameId) => {
          if (endedGameId === id) {
            setGameOver(true);
            setGameStatus("Game ended.");
            toast.info("Game has been ended.");
          }
        });
      });

      return () => {
        signalService.off("ReceiveGameUpdate");
        signalService.off("GameEnded");
      };
    }
  }, [id, navigate, updateGameState]); // Add updateGameState to the dependency array

  const fetchGame = async (gameId) => {
    try {
      const response = await fetch(`http://localhost:5130/api/Game/${gameId}`);
      if (!response.ok) throw new Error("Failed to fetch game data");
      const gameData = await response.json();
      setBoard([...gameData.board.cells]);
      if (gameData.winner && gameData.winner.mark === "-") {
        setGameStatus("It's a tie!");
      } else {
        setGameStatus(
          gameData.winner
            ? `${localStorage.getItem("winner")} wins!`
            : `${gameData.currentPlayer.name}'s turn`
        );
      }
      if (gameData.winningPattern) setWinningPattern(gameData.winningPattern);
    } catch (error) {
      toast.error("Error fetching game data.");
      console.log(error);
    }
  };

  const handleCellClick = (index) => {
    if (gameOver || board[index] !== null) return;

    const updatedBoard = [...board];
    updatedBoard[index] = currentPlayer.mark;
    setBoard(updatedBoard);

    if (!gameId) {
      console.error("Game ID not found.");
      toast.error("Game ID not found.");
      return;
    }

    signalService
      .send("MakeMove", { gameId: gameId, index: index })
      .catch((error) => {
        console.error("Error sending move:", error);
        toast.error("Error making move.");
      });
  };

  const handleEndGame = async () => {
    if (!gameId) return;

    try {
      await signalService.endGame(gameId);
      setGameOver(true);
      setGameStatus("Game ended.");
      toast.info("Game has been ended.");
      localStorage.clear();
      navigate("/");
    } catch (error) {
      toast.error("Error ending game.");
    }
  };

  const copyGameId = () => {
    const gameId = localStorage.getItem("gameId");
    if (gameId) {
      navigator.clipboard
        .writeText(gameId)
        .then(() => {
          toast.info("Game ID copied to clipboard!");
        })
        .catch((error) => {
          console.error("Failed to copy game ID:", error);
          toast.error("Failed to copy Game ID.");
        });
    } else {
      toast.error("Game ID not found.");
    }
  };

  return (
    <div>
      {currentPlayer &&
      currentPlayer.name === "Computer" &&
      !gameOver ? (
        <p className="loader">{gameStatus}</p>
      ) : (
        <p>{gameStatus}</p>
      )}

      <Board
        board={board}
        gameOver={gameOver}
        winningPattern={winningPattern}
        onCellClick={handleCellClick}
        currentPlayer={currentPlayer}
      />

      <div className="status">
        <button
          onClick={copyGameId}
          className="button"
          id="copy-game-id"
          disabled={gameOver}
        >
          Copy Game ID
        </button>

        <button onClick={handleEndGame} className="button" id="end-game">
          End Game
        </button>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Game;
