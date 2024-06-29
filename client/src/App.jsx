import "./App.css";
import { Routes, Route } from "react-router-dom";
import Homepage from "./pages/Home";
import { SocketProvider } from "./context/Socket";
import RoomPage from "./pages/Room";
import { PeerProvider } from "./context/Peer";

function App() {
  return (
    <SocketProvider>
      <PeerProvider>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
        </Routes>
      </PeerProvider>
    </SocketProvider>
  );
}

export default App;
