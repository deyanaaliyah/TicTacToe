import React from "react";

const Cell = ({ index, cell, isWinningCell, onClick, gameOver, disabled }) => (
  <button
    className={`cell ${isWinningCell ? "winning-cell" : ""} ${disabled ? "remove-hover-from-cell" : ""}`}
    onClick={() => onClick(index)}
    disabled={cell || gameOver || disabled}
  >
    {cell}
  </button>
);

export default Cell;
