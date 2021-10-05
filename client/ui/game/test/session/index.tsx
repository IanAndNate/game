import React, { useRef } from "react";
import styled from "@emotion/styled";
import { css, Global } from "@emotion/react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import {
  getGameState,
  useGame,
  useKeyboard,
} from "../../../../controllers/game";
import * as THREE from "three";
import { useEffect } from "react";
import { useMemo } from "react";
import { GameStatus } from "../../../../controllers/game/types";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { LineSegments } from "three";
extend({ OrbitControls });

const FullScreen = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
`;

const DURATION_FACTOR = 10;
const GAP = 0.3;

interface RailProps {
  idx: number;
  rails: number;
  totalDuration: number;
}

const getXPosition = (idx: number, rails: number): number => {
  // each rail is 1 wide with a 0.2 gap, and x is the middle of the mesh
  // |_||_||_|
  // rails + (rails - 1) * 0.2 = total width
  // LHS edge = - (total_width / 2)
  // offset from LHS = LHS edge + (idx * 1.2)
  const totalWidth = rails + (rails - 1) * GAP;
  const leftEdge = -totalWidth / 2;
  return leftEdge + idx * (1 + GAP);
};

const Rail = ({ idx, rails, totalDuration }: RailProps) => {
  const length = totalDuration * DURATION_FACTOR;
  return (
    <mesh
      position={[
        getXPosition(idx, rails),
        (totalDuration * DURATION_FACTOR) / 2,
        -0.01,
      ]}
    >
      <planeGeometry args={[1, totalDuration * DURATION_FACTOR]} />
      <meshBasicMaterial color="#eee" />
    </mesh>
  );
};

const Rails = () => {
  const [{ piece }] = useGame();
  const { notes, song } = piece;
  const totalDuration = useMemo(
    () =>
      song.reduce<number>((last, note) => {
        if (note.time + note.duration > last) {
          return note.time + note.duration;
        }
        return last;
      }, 0),
    [song]
  );
  return (
    <>
      {notes.map((_, idx) => (
        <Rail
          key={idx}
          idx={idx}
          rails={notes.length}
          totalDuration={totalDuration}
        />
      ))}
    </>
  );
};

interface NoteVizProps {
  duration: number;
  time: number;
  idx: number;
  rails: number;
  color: string;
}

const NoteViz = ({ duration, idx, rails, time, color }: NoteVizProps) => {
  const ref = useRef<LineSegments>();
  useFrame(() => {
    if (getGameState().keysDown.size > 0) {
      (ref.current.material as THREE.LineBasicMaterial).color = new THREE.Color(
        "red"
      );
    } else {
      (ref.current.material as THREE.LineBasicMaterial).color = new THREE.Color(
        "black"
      );
    }
  });
  const viz = useMemo(() => {
    // console.log("render note");
    const offset = time * DURATION_FACTOR;
    const geom = new THREE.PlaneGeometry(1, duration * DURATION_FACTOR);
    return (
      <>
        {/* <mesh position={[column * 1.2, offset, 0]}>
          <planeGeometry args={[1, duration * DURATION_FACTOR]} />
          <GradientMaterial color1="#4b95a3" color2="#ffffff" />
        </mesh> */}
        <lineSegments
          ref={ref}
          position={[
            getXPosition(idx, rails),
            offset + (duration * DURATION_FACTOR) / 2,
            0,
          ]}
        >
          <edgesGeometry attach="geometry" args={[geom]} />
          <lineBasicMaterial color={color} attach="material" linewidth={3} />
        </lineSegments>
        {/* <mesh
          position={[column * 1.2, offset, -0.005]}
          scale={new THREE.Vector3(1.05, 1.05, 1.05)}
        >
          <planeGeometry args={[1, duration * DURATION_FACTOR]} />
          <meshBasicMaterial color="black" />
        </mesh> */}
      </>
    );
  }, [duration]);
  return viz;
};

const NotesVisualization = () => {
  const [
    {
      piece: { song, notes },
      players,
    },
  ] = useGame();
  return useMemo(
    () => (
      <>
        {song.map((note, idx) => (
          <NoteViz
            key={idx}
            idx={notes.findIndex((n) => n.key === note.key)}
            duration={note.duration}
            time={note.time}
            rails={notes.length}
            // color="blue"
            color={players[0].isPressed && idx < 10 ? "red" : "black"}
          />
        ))}
      </>
    ),
    [notes, song]
  );
};

const MovingCamera = (): null => {
  const [
    {
      piece: { notes },
    },
  ] = useGame();
  useFrame(({ camera }) => {
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
  });
  return null;
};

const CameraControls = () => {
  // Get a reference to the Three.js Camera, and the canvas html element.
  // We need these to setup the OrbitControls class.
  // https://threejs.org/docs/#examples/en/controls/OrbitControls

  const {
    camera,
    gl: { domElement },
  } = useThree();

  // Ref to the controls, so that we can update them on every frame using useFrame
  const controls = useRef<OrbitControls>();
  useFrame(() => controls.current.update());
  return (
    //@ts-ignore
    <orbitControls
      ref={controls}
      args={[camera, domElement]}
      enableZoom={true}
      maxAzimuthAngle={Math.PI / 4}
      maxPolarAngle={Math.PI}
      minAzimuthAngle={-Math.PI / 4}
      minPolarAngle={0}
    />
  );
};

const InitGL = (): null => {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping = THREE.NoToneMapping;
    gl.pixelRatio = window.devicePixelRatio;
  }, [gl]);
  return null;
};

export const Session = () => {
  const [{ status }] = useGame();
  useKeyboard();
  if (status !== GameStatus.Running) {
    return null;
  }
  return (
    <FullScreen>
      <Global
        styles={css`
          body {
            margin: 0;
          }
        `}
      />
      <Canvas camera={{ far: 1000 }}>
        <Rails />
        <NotesVisualization />
        {/* <MovingCamera /> */}
        <CameraControls />
        <InitGL />
      </Canvas>
    </FullScreen>
  );
};
