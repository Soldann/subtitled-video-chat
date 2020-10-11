import React, { useEffect, useRef, useState } from 'react';

const CreateCall = () => {
  const [peerId, setPeerId] = useState('');

  const videoRef = useRef();
  const audioRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
      })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      });

    import('peerjs').then((module) => {
      const Peer = module.default;
      const peer = new Peer({
        host: 'polar-escarpment-94286.herokuapp.com',
        port: 80,
      });
      peer.on('open', (id) => {
        setPeerId(id);
        let conn = null;
        peer.on('connection', (_conn) => {
          console.log('connected');
          conn = _conn;
          conn.on('data', (data) => {
            console.log('received data');
          });
        });

        navigator.mediaDevices
          .getUserMedia({
              audio: true,
              video: true,
          })
          .then((stream) => {
              peer.on('call', (call) => {
                videoRef.current.srcObject = stream;
              console.log('received call');
              call.answer(stream);
              call.on('stream', (stream) => {
                console.log('received stream');
                audioRef.current.srcObject = stream;
              });
            });
          });
      });
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className={peerId ? '' : 'hidden'}>
          <div className="text-3xl">
            Your call ID is: {peerId}
          </div>
        <video
          autoPlay
          className="absolute rounded"
          ref={videoRef}
          style={{
            bottom: 16,
            right: 16,
            width: 320,
          }}
        ></video>
        <video autoPlay className="h-0" ref={audioRef}></video>
      </div>
      {!peerId && <div className="text-3xl">Loading...</div>}
    </div>
  );
};

export default CreateCall;