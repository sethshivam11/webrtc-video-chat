import React, { useCallback, useEffect } from "react";
import { useSocket } from "../context/Socket";
import { useNavigate } from "react-router-dom";

const Homepage = () => {
  const { socket } = useSocket();
  function handleJoinRoom() {
    socket.emit("join-room", { emailId: email, roomId });
  }
  const [email, setEmail] = React.useState("");
  const [roomId, setRoomId] = React.useState("");
  const navigate = useNavigate();

  const handleRoomJoined = useCallback(({ roomId }) => {
    navigate(`/room/${roomId}`);
  }, [navigate]);

  useEffect(() => {
    socket.on("joined-room", handleRoomJoined);

    return () => {
      socket.off("joined-room", handleRoomJoined);
    };
  }, []);
  return (
    <div className="homepage-container">
      <div className="input-container">
        <input
          type="name"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your name"
        />
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter room code"
        />
        <button onClick={handleJoinRoom}>Enter Room</button>
      </div>
    </div>
  );
};

export default Homepage;
