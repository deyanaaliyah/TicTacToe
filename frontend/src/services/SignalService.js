import * as signalR from "@microsoft/signalr";

class SignalService {
  constructor() {
    this.connection = null;
    this.eventHandlers = {};
    this.gameUpdateCallback = null; // External callback for game updates
    this.gameCreatedCallback = null; // External callback for game creation events
  }

  async startConnection() {
    if (
      this.connection &&
      this.connection.state === signalR.HubConnectionState.Connected
    ) {
      console.log("SignalR connection is already established.");
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5130/gamehub")
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.connection.onreconnected(() =>
      console.log("Reconnected to SignalR hub.")
    );
    this.connection.onclose(() =>
      console.log("Disconnected from SignalR hub.")
    );
    this.connection.on("Error", (errorData) => {
      console.error("SignalR error received:", errorData);
    });

    // Listen for game state updates (from JoinGame and MakeMove)
    this.connection.on("ReceiveGameUpdate", (data) => {
      if (this.gameUpdateCallback) {
        this.gameUpdateCallback(data);
      }
      if (this.eventHandlers["ReceiveGameUpdate"]) {
        this.eventHandlers["ReceiveGameUpdate"](data);
      }
    });

    // Listen for new game creation events
    this.connection.on("GameCreated", (data) => {
      if (this.gameCreatedCallback) {
        this.gameCreatedCallback(data);
      }
      if (this.eventHandlers["GameCreated"]) {
        this.eventHandlers["GameCreated"](data);
      }
    });

    // Listen for game end events
    this.connection.on("GameEnded", (data) => {
      if (this.eventHandlers["GameEnded"]) {
        this.eventHandlers["GameEnded"](data);
      }
    });

    try {
      await this.connection.start();
      console.log("Connected to SignalR hub!");
    } catch (error) {
      console.error("Error establishing SignalR connection:", error);
    }
  }

  stopConnection() {
    if (this.connection) {
      this.connection.stop();
      console.log("SignalR connection stopped.");
    }
  }

  // Allows external modules to register event handlers
  on(eventName, callback) {
    if (!this.connection) {
      console.warn("SignalR connection not established yet.");
      return;
    }
    this.eventHandlers[eventName] = callback;
  }

  off(eventName) {
    if (this.connection && this.eventHandlers[eventName]) {
      this.connection.off(eventName, this.eventHandlers[eventName]);
      delete this.eventHandlers[eventName];
    }
  }

  async send(eventName, data) {
    if (
      this.connection &&
      this.connection.state === signalR.HubConnectionState.Connected
    ) {
      try {
        // Spread the values so that the hub receives them as separate arguments
        await this.connection.invoke(eventName, ...Object.values(data));
      } catch (error) {
        console.error(`Error sending ${eventName}:`, error);
      }
    } else {
      console.warn("SignalR connection is not established.");
    }
  }

  async endGame(gameId) {
    if (
      this.connection &&
      this.connection.state === signalR.HubConnectionState.Connected
    ) {
      try {
        const response = await fetch(
          `http://localhost:5130/api/Game/${gameId}/end`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          throw new Error(`Failed to end game: ${response.statusText}`);
        }
        this.stopConnection();
      } catch (error) {
        console.error("Error ending the game:", error);
      }
    } else {
      console.warn("SignalR connection is not established.");
    }
  }

  setGameUpdateCallback(callback) {
    this.gameUpdateCallback = callback;
  }

  setGameCreatedCallback(callback) {
    this.gameCreatedCallback = callback;
  }
}

const signalServiceInstance = new SignalService();
export default signalServiceInstance;
