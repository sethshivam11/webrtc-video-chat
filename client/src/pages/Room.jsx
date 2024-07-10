import React, { useCallback, useEffect } from "react";
import { useSocket } from "../context/Socket";
import { usePeer } from "../context/Peer";
import ReactPlayer from "react-player";

const RoomPage = () => {
  const { socket } = useSocket();
  const {
    peer,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    sendStream,
    remoteStream,
    endCall,
  } = usePeer();
  const [myStream, setMyStream] = React.useState(null);
  const [remoteEmailId, setRemoteEmailId] = React.useState("");
  const [callAccepted, setCallAccepted] = React.useState(false);
  const [sendingStream, setSendingStream] = React.useState(false);

  const handleNewUserJoined = useCallback(
    async (data) => {
      const { emailId } = data;
      const offer = await createOffer();
      socket.emit("call-user", { emailId, offer });
      setRemoteEmailId(emailId);
    },
    [createOffer, socket]
  );

  const handleIncomingCall = useCallback(
    async (data) => {
      const { from, offer } = data;
      const ans = await createAnswer(offer);
      setCallAccepted(true);
      socket.emit("call-accepted", { emailId: from, ans });
      setRemoteEmailId(from);
    },
    [createAnswer, socket]
  );

  const handleCallAccepted = useCallback(async (data) => {
    const { ans } = data;
    await setRemoteAnswer(ans);
  }, []);

  const getUserMediaStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setMyStream(stream);
  }, []);

  useEffect(() => {
    socket.on("user-joined", handleNewUserJoined);

    socket.on("incoming-call", handleIncomingCall);

    socket.on("call-accepted", handleCallAccepted);

    return () => {
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
    };
  }, [socket, handleNewUserJoined, handleCallAccepted, handleIncomingCall]);

  const handleNegotiation = useCallback(async () => {
    const localOffer = await peer.createOffer();
    await peer.setLocalDescription(localOffer);
    socket.emit("call-user", { emailId: remoteEmailId, offer: localOffer });
    sendStream(myStream);
    setSendingStream(true);
  }, [peer.localDescription, remoteEmailId, socket]);

  const handleDisconnection = useCallback((event) => {
    if (event.target.connectionState === "disconnected") {
      setRemoteEmailId("");
    }
  });

  useEffect(() => {
    peer.onnegotiationneeded = handleNegotiation;
    peer.onconnectionstatechange = handleDisconnection;
    getUserMediaStream();
    return () => {
      peer.removeEventListener("negotiationneeded", handleNegotiation);
    };
  }, [peer, handleNegotiation, handleDisconnection]);

  useEffect(() => {
    if (myStream && remoteStream && !sendingStream) {
      sendStream(myStream);
      setSendingStream(true);
    }
  }, [sendStream, remoteStream, sendingStream]);

  return (
    <div className="roompage-container">
      <h4>
        {remoteEmailId ? (
          <span
            style={{ color: "green" }}
          >{`You are connected to ${remoteEmailId}`}</span>
        ) : (
          <span style={{ color: "red" }}>You are not connected</span>
        )}
      </h4>
      {remoteEmailId && !sendingStream ? (
        <button onClick={() => sendStream(myStream)}>Connect</button>
      ) : (
        !callAccepted && "Waiting for connection..."
      )}
      {callAccepted && remoteStream && (
        <button style={{ background: "red" }} onClick={endCall}>
          End
        </button>
      )}
      <div className="both-video-container">
        <ReactPlayer
          url={myStream}
          playing
          muted
          className="self-video"
          width="200px"
          playsinline
        />
        <ReactPlayer
          url={remoteStream}
          playing
          className="remote-video"
          width="100%"
          playsinline
        />
      </div>
    </div>
  );
};

export default RoomPage;
