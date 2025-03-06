import './App.css';
import React from "react";
import { Routes, Route } from "react-router-dom";
import Lobby from "./components/Lobby";
import Game from "./components/Game";

function App() {
  return (
    <div className="App">
      <h2>Tic Tac Toe</h2>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/game/:id" element={<Game />} />
      </Routes>
    </div>
  );
}

export default App;
