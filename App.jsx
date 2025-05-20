import { useState, useRef, useEffect } from "react";
import Die from "./Die";
import { nanoid } from "nanoid";
import Confetti from "react-confetti";

export default function App() {
  function useWindowSize() {
    const [size, setSize] = useState({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    useEffect(() => {
      function handleResize() {
        setSize({ width: window.innerWidth, height: window.innerHeight });
      }

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    return size;
  }

  const { width, height } = useWindowSize();

  const [dice, setDice] = useState(() => generateAllNewDice());
  const [time, setTime] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [bestTime, setBestTime] = useState(() => {
    const saved = localStorage.getItem("bestTime");
    return saved ? JSON.parse(saved) : null;
  });
  const buttonRef = useRef(null);

  const gameWon =
    dice.every((die) => die.isHeld) &&
    dice.every((die) => die.value === dice[0].value);

  // Timer effect - runs only when game is not won
  useEffect(() => {
    let timer;
    if (!gameWon) {
      timer = setInterval(() => setTime((prev) => prev + 1), 1000);
    } else if (gameWon && (bestTime === null || time < bestTime)) {
      setBestTime(time);
      localStorage.setItem("bestTime", JSON.stringify(time));
    }
    return () => clearInterval(timer);
  }, [gameWon, time, bestTime]);

  // Focus "New Game" button when game is won
  useEffect(() => {
    if (gameWon && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [gameWon]);

  function generateAllNewDice() {
    return new Array(10).fill(0).map(() => ({
      value: Math.ceil(Math.random() * 6),
      isHeld: false,
      id: nanoid(),
    }));
  }

  function rollDice() {
    if (!gameWon) {
      setDice((oldDice) =>
        oldDice.map((die) =>
          die.isHeld ? die : { ...die, value: Math.ceil(Math.random() * 6) }
        )
      );
      setAttempts((prev) => prev + 1);
    } else {
      setDice(generateAllNewDice());
      setTime(0);
      setAttempts(0);
    }
  }

  function hold(id) {
    setDice((oldDice) =>
      oldDice.map((die) =>
        die.id === id ? { ...die, isHeld: !die.isHeld } : die
      )
    );
  }

  const diceElements = dice.map((dieObj) => (
    <Die
      key={dieObj.id}
      value={dieObj.value}
      isHeld={dieObj.isHeld}
      hold={() => hold(dieObj.id)}
    />
  ));

  return (
    <main>
      {gameWon && <Confetti width={width} height={height} />}

      <div aria-live="polite" className="sr-only">
        {gameWon && (
          <p>Congratulations! You won! Press "New Game" to start again.</p>
        )}
      </div>
      <h1 className="title">Tenzies</h1>
      <p className="instructions">
        Roll until all dice are the same. Click each die to freeze it at its
        current value between rolls.
      </p>

      <div className="stats">
        <p>⏱ Time: {time}s</p>
        <p>🎲 Attempts: {attempts}</p>
        <p>🏆 Best: {bestTime !== null ? bestTime + "s" : "—"}</p>
      </div>

      <div className="dice-container">{diceElements}</div>

      <button ref={buttonRef} className="roll-dice" onClick={rollDice}>
        {gameWon ? "New Game" : "Roll"}
      </button>
    </main>
  );
}
