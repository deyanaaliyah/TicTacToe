import React from "react";
import Cell from "./Cell";

const Board = ({ board, gameOver, winningPattern, onCellClick, currentPlayer }) => {
    const playerName = localStorage.getItem("playerName");
    const isDisabled = currentPlayer && currentPlayer.name !== playerName;  // Check if the current player is not the local player
  
    return (
      <div className={`grid ${gameOver ? "game-over" : ""}`}>
        {board.map((cell, index) => (
          <Cell
            key={index}
            index={index}
            cell={cell}
            isWinningCell={winningPattern.includes(index)}
            onClick={onCellClick}
            gameOver={gameOver}
            disabled={isDisabled}  // Pass 'disabled' prop to each cell
          />
        ))}
      </div>
    );
  };
  
  export default Board;
  