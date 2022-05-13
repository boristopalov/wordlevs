import { useRouter } from "next/router";
import React, { useState } from "react";
import { useSocket } from "../../context/socketContext";
import styles from "./create-room.module.css";

interface Props {
  loggedIn: boolean;
}

const CreateRoomForm = ({ loggedIn }: Props): JSX.Element => {
  const socket = useSocket();
  const [roomIdToCreate, setRoomIdToCreate] = useState("");
  const router = useRouter();

  const handleCreateRoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomIdToCreate(e.target.value);
  };

  const createRoom = (e: React.FormEvent<HTMLFormElement>) => {
    if (!loggedIn) {
      return;
    }
    e.preventDefault();
    // console.log(roomId);
    socket?.emit("create_room", roomIdToCreate);
    socket?.once("create_room_fail", (roomId: string) => {
      console.log(`${roomId} already exists`);
      return;
    });
    socket?.once("create_room_success", (roomId: string) => {
      router.push(`/game/${roomId}`);
      return;
    });
  };
  return (
    <div className={styles.container}>
      <form onSubmit={createRoom} className={styles.form}>
        <input
          placeholder="Room Name"
          value={roomIdToCreate}
          onChange={handleCreateRoomChange}
          disabled={!loggedIn}
        />
        <button type="submit" disabled={!loggedIn}>
          Create Game
        </button>
      </form>
    </div>
  );
};

export default CreateRoomForm;
