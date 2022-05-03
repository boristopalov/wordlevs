import { useEffect, useState } from "react";
import Keyboard from "../../components/keyboard/Keyboard";
import Table from "../../components/player/Table";
import OpponentTable from "../../components/opponent/OpponentTable";
import GameState from "../../types/OpponentGameState";
import styles from "../../styles/Game.module.css";
import { VALIDGUESSES } from "../../constants/validGuesses";
import { WORDS } from "../../constants/words";
import { WORDOFTHEDAY } from "../../utils/getRandomWord";
import {
  fetchPrevGuessesFromStorage,
  fetchCurrentRowFromStorage,
  fetchGameWonFromStorage,
  fetchOpponentPrevGuessesFromStorage,
  fetchOpponentCurrentRowFromStorage,
  fetchOpponentGameWonFromStorage,
} from "../../utils/fetchFromStorage";
import { useRouter } from "next/router";
import { useSocket } from "../../context/socketContext";

import { gql, useLazyQuery } from "@apollo/client";

const GET_GAME = gql`
  query getGameByRoom($roomId: String!) {
    getGameByRoom(roomId: $roomId) {
      errors {
        message
      }
      game {
        id
        p1Id
        p2Id
        roomId
        p1PrevGuesses
        p1CurrentRow
        p1CurrentGuess
        p1GameWon
        p2PrevGuesses
        p2CurrentRow
        p2CurrentGuess
        p2GameWon
      }
    }
  }
`;

interface GetGameResponse {
  id: number;
  p1Id: number;
  p2Id: number;
  roomId: string;
  p1PrevGuesses: string[];
  p1CurrentRow: number;
  p1CurrentGuess: string[];
  p1GameWon: boolean;
  p2PrevGuesses: string[];
  p2CurrentRow: number;
  p2CurrentGuess: string[];
  p2GameWon: boolean;
}

const UPDATE_GAME = gql`
  mutation updateGameState(
    $roomId: String!
    $p1PrevGuesses: [String]!
    $p1CurrentGuess: [String]!
    $p1CurrentRow: Float!
    $p1GameWon: Boolean!
    $p2PrevGuesses: [String]!
    $p2CurrentGuess: [String]!
    $p2CurrentRow: Float!
    $p2GameWon: Boolean!
  ) {
    updateGameState(
      roomId: $roomId
      p1PrevGuesses: $p1PrevGuesses
      p1CurrentGuess: $p1CurrentGuess
      p1CurrentRow: $p1CurrentRow
      p1GameWon: $p1GameWon
      p2PrevGuesses: $p2PrevGuesses
      p2CurrentGuess: $p2CurrentGuess
      p2CurrentRow: $p2CurrentRow
      p2GameWon: $p2GameWon
    ) {
      errors {
        message
      }
      game {
        roomId
        p1PrevGuesses
        p1CurrentRow
        p1CurrentGuess
        p1GameWon
        p2PrevGuesses
        p2CurrentRow
        p2CurrentGuess
        p2GameWon
      }
    }
  }
`;

const Game = (): JSX.Element => {
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [prevGuesses, setPrevGuesses] = useState<string[]>([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const router = useRouter();
  const socket = useSocket();
  const [opponentCurrentGuess, setOpponentCurrentGuess] = useState<string[]>(
    []
  );
  const [opponentPrevGuesses, setOpponentPrevGuesses] = useState<string[]>([]);
  const [opponentCurrentRow, setOpponentCurrentRow] = useState(0);
  const [opponentGameWon, setOpponentGameWon] = useState(false);

  const roomId =
    typeof router.query.roomId === "string" ? router.query.roomId : null;
  console.log(roomId);
  const [getGame, { loading, error, data }] = useLazyQuery(GET_GAME, {
    variables: { roomId: roomId },
  });

  const handleEnter = () => {
    const guessString = currentGuess.join("").toLowerCase();
    if (guessString === "hells") {
      setGameWon(() => {
        localStorage.setItem("gameWon", "true");
        return true;
      });
    }

    if (
      currentGuess.length === 5 &&
      currentRow < 6 &&
      (VALIDGUESSES.includes(guessString) || WORDS.includes(guessString))
    ) {
      setCurrentGuess(() => {
        localStorage.setItem("currentGuess", JSON.stringify([]));
        return [];
      });
      setPrevGuesses((prevGuesses) => {
        const newGuesses = [...prevGuesses, guessString];
        localStorage.setItem("prevGuesses", JSON.stringify(newGuesses));
        return newGuesses;
      });
      setCurrentRow((currentRow) => {
        const nextRow = currentRow + 1;
        localStorage.setItem("currentRow", JSON.stringify(nextRow));
        return nextRow;
      });
    }
  };

  const handleBackspace = () => {
    setCurrentGuess((prevGuess) => {
      const newGuess = prevGuess.slice(0, prevGuess.length - 1);
      localStorage.setItem("currentGuess", JSON.stringify(newGuess));
      return newGuess;
    });
  };

  const handleLetter = (key: string) => {
    if (currentGuess.length < 5) {
      setCurrentGuess((prevGuess) => {
        const newGuess = [...prevGuess, key];
        localStorage.setItem("currentGuess", JSON.stringify(newGuess));
        return newGuess;
      });
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    const key = e.key.toUpperCase();
    if (!gameWon && !opponentGameWon) {
      if (key === "ENTER") {
        handleEnter();
      }
      if (key === "BACKSPACE") {
        handleBackspace();
      }
      if (key.length == 1 && key >= "A" && key <= "Z") {
        handleLetter(key);
      }
    }
  };

  const handleKeyBoardClick = (e: React.MouseEvent<HTMLElement>) => {
    const key = e.currentTarget.getAttribute("data-key");
    if (!gameWon && !opponentGameWon) {
      if (key === "ENTER") {
        handleEnter();
      }
      if (key === "BACKSPACE") {
        handleBackspace();
      }
      if (key?.length == 1 && key >= "A" && key <= "Z") {
        handleLetter(key);
      }
    }
  };

  useEffect(() => {
    const getGameFromRoomQueryParam = async () => {
      const currentGame = await getGame();
      if (currentGame.loading) {
        console.log("loading");
      }
      if (currentGame.error) {
        console.log(error);
      }
      if (!currentGame.data) {
        console.log("wtf");
      }
      console.log(currentGame.data);
      const {
        p1Id,
        p2Id,
        roomId,
        p1PrevGuesses,
        p1CurrentRow,
        p1CurrentGuess,
        p1GameWon,
        p2PrevGuesses,
        p2CurrentRow,
        p2CurrentGuess,
        p2GameWon,
      }: GetGameResponse = currentGame.data.getGameByRoom.game;

      setPrevGuesses(p1PrevGuesses);
      setCurrentGuess(p1CurrentGuess);
      setCurrentRow(p1CurrentRow);
      setGameWon(p1GameWon);
      setOpponentCurrentGuess(p2PrevGuesses);
      setOpponentCurrentRow(p2CurrentRow);
      setCurrentGuess(p2CurrentGuess);
      setOpponentGameWon(p2GameWon);
    };
    getGameFromRoomQueryParam();
  }, []);

  useEffect(() => {
    setPrevGuesses(fetchPrevGuessesFromStorage);
    setCurrentRow(fetchCurrentRowFromStorage);
    setGameWon(fetchGameWonFromStorage);
    setOpponentPrevGuesses(fetchOpponentPrevGuessesFromStorage);
    setOpponentCurrentRow(fetchOpponentCurrentRowFromStorage);
    setOpponentGameWon(fetchOpponentGameWonFromStorage);
    const updateOpponentGameState = ({
      opponentCurrentGuess,
      opponentCurrentRow,
      opponentPrevGuesses,
      opponentGameWon,
    }: GameState) => {
      setOpponentCurrentGuess(opponentCurrentGuess);
      setOpponentCurrentRow(opponentCurrentRow);
      setOpponentPrevGuesses(opponentPrevGuesses);
      setOpponentGameWon(opponentGameWon);
      localStorage.setItem(
        "opponentCurrentGuess",
        JSON.stringify(opponentCurrentGuess)
      );
      localStorage.setItem(
        "opponentCurrentRow",
        JSON.stringify(opponentCurrentRow)
      );
      localStorage.setItem(
        "opponentPrevGuesses",
        JSON.stringify(opponentPrevGuesses)
      );
      localStorage.setItem("opponentGameWon", JSON.stringify(opponentGameWon));
    };
    socket?.on("on_update_game", updateOpponentGameState);
    return () => {
      socket?.off("on_update_game", updateOpponentGameState);
    };
  }, [socket]);

  useEffect(() => {
    socket?.emit(
      "update_game",
      {
        gameState: {
          currentGuess: currentGuess,
          prevGuesses: prevGuesses,
          currentRow: currentRow,
          gameWon: gameWon,
        },
      },
      roomId
    );
  }, [currentGuess, currentRow, gameWon, prevGuesses, roomId, socket]);

  return (
    <div className={styles.wrapper}>
      {/* {opponentGameState} */}
      <div className={styles.tableWrapper}>
        <Table
          gameState={{
            currentGuess: currentGuess,
            prevGuesses: prevGuesses,
            currentRow: currentRow,
            gameWon: gameWon,
          }}
          handleKeyPress={handleKeyPress}
        />
        <OpponentTable
          gameState={{
            prevGuesses: opponentPrevGuesses,
            currentRow: opponentCurrentRow,
            gameWon: opponentGameWon,
          }}
          handleKeyPress={handleKeyPress}
        />
      </div>
      <Keyboard
        gameState={{
          currentGuess: currentGuess,
          prevGuesses: prevGuesses,
          currentRow: currentRow,
          gameWon: gameWon,
        }}
        guessedAbsent={[]}
        guessedCorrect={[]}
        guessedPresent={[]}
        handleKeyBoardClick={handleKeyBoardClick}
      />
    </div>
  );
};

export default Game;
