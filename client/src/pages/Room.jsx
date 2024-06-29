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
    endCall
  } = usePeer();
  const [myStream, setMyStream] = React.useState(null);
  const [remoteEmailId, setRemoteEmailId] = React.useState("");
  const [callAccepted, setCallAccepted] = React.useState(false);

  const handleNewUserJoined = useCallback(
    async (data) => {
      const { emailId } = data;
      console.log("New user joined room: ", emailId);
      const offer = await createOffer();
      socket.emit("call-user", { emailId, offer });
      setRemoteEmailId(emailId);
    },
    [createOffer, socket]
  );

  const handleIncomingCall = useCallback(
    async (data) => {
      const { from, offer } = data;
      console.log("Incoming call from: ", from, offer);
      const ans = await createAnswer(offer);
      setCallAccepted(true);
      socket.emit("call-accepted", { emailId: from, ans });
      setRemoteEmailId(from);
    },
    [createAnswer, socket]
  );

  const handleCallAccepted = useCallback(async (data) => {
    const { ans } = data;
    console.log("Call got accepted", ans);
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
    console.log("Negotiation needed");
    const localOffer = await peer.createOffer();
    await peer.setLocalDescription(localOffer);
    socket.emit("call-user", { emailId: remoteEmailId, offer: localOffer });
  }, [peer.localDescription, remoteEmailId, socket]);

  useEffect(() => {
    peer.onnegotiationneeded = handleNegotiation;
    return () => {
      peer.removeEventListener("negotiationneeded", handleNegotiation);
    };
  }, [peer, handleNegotiation]);

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
      {myStream ? (
        remoteEmailId ? (
          <>
            <button onClick={(e) => sendStream(myStream)}>
              {callAccepted ? "Accept" : "Call"}
            </button>
            <button style={{background: "red"}} onClick={endCall}>End</button>
          </>
        ) : (
          ""
        )
      ) : (
        <button onClick={() => getUserMediaStream()}>Start</button>
      )}
      <div className="both-video-container">
        <ReactPlayer
          url={myStream}
          playing
          muted
          className="self-video"
          width="200px"
        />
        <ReactPlayer
          url={remoteStream}
          playing
          className="remote-video"
          width="100%"
        />
      </div>
    </div>
  );
};

export default RoomPage;
