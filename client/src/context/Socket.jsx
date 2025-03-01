import React, { useMemo } from "react";
import { io } from "socket.io-client";

const SocketContext = React.createContext({});

export const SocketProvider = ({ children }) => {
  const socket = useMemo(() => io("/"), []);
  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return React.useContext(SocketContext);
};
