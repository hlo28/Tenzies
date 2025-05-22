import { useState, useEffect, useRef } from "react";
import Die from "./Die";
import { nanoid } from "nanoid";
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";

export default function App() {
  const [dice, setDice] = useState(generateAllNewDice());
  const [time, setTime] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [bestTime, setBestTime] = useState(() => {
    const saved = localStorage.getItem("bestTime");
    return saved ? JSON.parse(saved) : null;
  });

  const buttonRef = useRef(null);
  const intervalRef = useRef(null);
  const { width, height } = useWindowSize();

  const gameWon = dice.every(die => die.isHeld) &&
                  dice.every(die => die.value === dice[0].value);

  useEffect(() => {
    if (gameWon) {
      if (bestTime === null || time < bestTime) {
        setBestTime(time);
        localStorage.setItem("bestTime", JSON.stringify(time));
      }
      setHasStarted(false);
      if (buttonRef.current) buttonRef.current.focus();
    }
  }, [gameWon]);

  useEffect(() => {
    let interval = null;
    if (hasStarted && !gameWon) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
      intervalRef.current = interval;
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [hasStarted, gameWon]);

  function generateAllNewDice() {
    return new Array(10).fill(0).map(() => ({
      value: Math.ceil(Math.random() * 6),
      isHeld: false,
      id: nanoid()
    }));
  }

  function rollDice() {
    if (!hasStarted) setHasStarted(true);

    if (!gameWon) {
      setDice(oldDice =>
        oldDice.map(die =>
          die.isHeld ? die : { ...die, value: Math.ceil(Math.random() * 6) }
        )
      );
    } else {
      setHasStarted(false);
      setTime(0);
      setDice(generateAllNewDice());
    }
  }

  function hold(id) {
    if (!hasStarted) {
        setHasStarted(true);
    }
    setDice(oldDice => oldDice.map(die =>
        die.id === id
            ? { ...die, isHeld: !die.isHeld }
            : die
    ));
}

  const diceElements = dice.map(dieObj => (
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
        {gameWon && <p>Congratulations! You won! Press "New Game" to start again.</p>}
      </div>
      <h1 className="title">Tenzies</h1>
      <p className="instructions">
        Roll until all dice are the same. Click each die to freeze it at its current value between rolls.
      </p>
      <div className="stats">
        <p>⏱ Time: {time}s</p>
        <p>🏆 Best: {bestTime !== null ? bestTime + "s" : "—"}</p>
      </div>
      <div className="dice-container">
        {diceElements}
      </div>
      <button ref={buttonRef} className="roll-dice" onClick={rollDice}>
        {gameWon ? "New Game" : "Roll"}
      </button>
    </main>
  );
}
