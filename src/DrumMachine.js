import { useState, useEffect } from "react";
import useSound from "use-sound";
import { sounds } from "./sounds.js";
import audio from "./audio/audio.mp3";
import audio2 from "./audio/audio2.mp3";
import KeyboardEventHandler from "react-keyboard-event-handler";
import "./styles.css";

const MAX_TRACK_LENGTH = 160;
const DEFAULT_TEMPO = 100;
const SOUND_LIST = ["Q", "W", "E", "A", "S", "D", "Z", "X", "C"];

const HOME_URL = "https://1tzee.csb.app/";

// Handles keyboard button press
function Key(props) {
  return (
    <KeyboardEventHandler
      handleKeys={props.keys}
      handleFocusableElements={true}
      onKeyEvent={(key) => {
        const keyInfo = [key, props.keys.indexOf(key)];
        props.handleClick(keyInfo);
      }}
    />
  );
}

function DrumPad(props) {
  const buttonId = props.ch + "_pad";
  return (
    <button
      id={buttonId}
      name={props.id}
      className={props.activeDrum === props.id ? "drum-pad active" : "drum-pad"}
      onClick={props.handleClick}
      disabled={props.imported ? "disabled" : props.isPlaying && "disabled"}
    >
      {props.ch}
    </button>
  );
}

function DrumMachine() {
  const [activeDrum, setActiveDrum] = useState(null);
  const [chord, setChord] = useState(null);
  const [track, setTrack] = useState([]);
  const [chordTime, setChordTime] = useState([]);
  const [tempo, setTempo] = useState(DEFAULT_TEMPO);
  const [exportURL, setExportURL] = useState([[], [], 0]);
  const [imported, setImported] = useState(false);
  const [resetPressed, setResetPressed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [drumSet, setDrumSet] = useState(0);

  const [play] = useSound(audio, {
    sprite: {
      Q: [45, 470],
      W: [600, 350],
      E: [969, 318],
      A: [1311, 239],
      S: [1574, 206],
      D: [1807, 335],
      Z: [2237, 364],
      X: [2658, 330],
      C: [3225, 75]
    }
  });
  const [play2] = useSound(audio2, {
    sprite: {
      Q: [37, 1454],
      W: [1518, 1047],
      E: [2585, 2560],
      A: [5180, 286],
      S: [5490, 286],
      D: [5805, 153],
      Z: [5988, 286],
      X: [6300, 176],
      C: [6512, 163]
    }
  });

  if (!imported && window.location.href !== HOME_URL && !resetPressed) {
    importTrack();
  }

  function playSound(sound) {
    switch (drumSet) {
      case 0:
        play({ id: sound });
        break;
      case 1:
        play2({ id: sound });
        break;
      default:
        return;
    }
  }

  function importTrack() {
    try {
      const jsonParse = JSON.parse(
        atob(window.location.href.split(HOME_URL)[1].split("?")[0])
      );
      const chordArr = jsonParse[0];
      const timeArr = jsonParse[1];
      const drumSetValue = jsonParse[2];
      if (chordArr.length !== timeArr.length) return;
      if (chordArr.length < MAX_TRACK_LENGTH) {
        setTrack(chordArr);
        setChordTime(timeArr);
        setDrumSet(drumSetValue);
        setImported(true);
      } else {
        window.location.href = HOME_URL;
        alert("Track import is too long!");
      }
    } catch {
      window.location.href = HOME_URL;
    }
  }

  function copyUrl() {
    let copyText = document.getElementById("export-input");
    let copyButton = document.getElementById("copy-button");
    const copyButtonText = copyButton.innerHTML;
    const copyButtonStyle = copyButton.style;
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    copyButton.innerHTML = "Copied";
    copyButton.style = "background-color: green";
    copyButton.disabled = "disabled";
    setTimeout(() => {
      copyButton.innerHTML = copyButtonText;
      copyButton.style = copyButtonStyle;
      copyButton.disabled = "";
    }, 2000);
    //alert("Copied the URL: " + copyText.value);
  }

  function handleDrumset(e) {
    const exportURLarr = [...exportURL];
    const drumSetValue = parseInt(e.target.value, 10);
    exportURLarr.pop();
    exportURLarr.push(drumSetValue);
    setExportURL(exportURLarr);
    setDrumSet(drumSetValue);
  }

  // Function to play the chord
  // on keyboard or mouse click
  function handleClick(event) {
    if (imported || isPlaying) return;
    let sound;
    let drumName;
    if (event.target) {
      sound = event.target.id.split("_")[0];
      drumName = event.target.name;
    } else {
      sound = event[0];
      drumName = sounds[drumSet][event[1]].id;
    }
    // Saving played notes
    if (track.length < MAX_TRACK_LENGTH) {
      const trackArr = [...track];
      const chordTimeArr = [...chordTime];
      const exportURLarr = [...exportURL];
      chordTimeArr.push(Date.now());
      setChordTime(chordTimeArr);
      trackArr.push(sound);
      setTrack(trackArr);
      // Adding export URL
      exportURLarr[0].push(sound);
      exportURLarr[1].push(Date.now());
      setExportURL(exportURLarr);

      // Playing sound
      playSound(sound);
      setChord(drumName);
      setActiveDrum(drumName);
    }
  }

  // Playback
  async function handlePlayback() {
    if (isPlaying) return;
    if (track.length > 0 && track.length === chordTime.length) {
      setIsPlaying(true);
      for (let i = 0; i < track.length; i++) {
        let chordT = 100 * (tempo / 100);
        if (i > 0) {
          chordT = (chordTime[i] - chordTime[i - 1]) * (tempo / 100);
        }
        const drumName = sounds[drumSet][SOUND_LIST.indexOf(track[i])].id;
        await new Promise((resolve) => {
          setTimeout(() => {
            playSound(track[i]);
            setChord(drumName);
            setActiveDrum(drumName);
            resolve();
          }, chordT);
        });
        if (i === track.length - 1)
          setTimeout(() => {
            setIsPlaying(false);
          }, 300);
      }
    }
  }
  // reseting active drum so it changes css back to normal
  // after being activated
  useEffect(() => {
    setActiveDrum(null);
  }, [activeDrum]);

  // Generating drump pads

  const drumPads = [];
  const keys = [];
  try {
    for (let i = 0; i < sounds[drumSet].length; i++) {
      drumPads.push(
        <DrumPad
          key={i}
          id={sounds[drumSet][i].id}
          ch={sounds[drumSet][i].keyTrigger}
          num={i}
          handleClick={handleClick}
          activeDrum={activeDrum}
          imported={imported}
          isPlaying={isPlaying}
        />
      );
      // might as well use the same loop to generate
      // necessary keyboard keys
      keys.push(sounds[drumSet][i].keyTrigger);
    }
  } catch {
    window.location.href = HOME_URL;
  }
  return (
    <div id="main" className="noselect">
      <div id="controls" className="display">
        {
          // Playback
        }
        <div className="chord-title">
          <span>Playback:</span>
        </div>
        <div className="chord-display playback-display">
          <p className="text">Tempo:</p>
          <input
            type="range"
            min="50"
            max="150"
            value={tempo}
            onChange={(e) => setTempo(e.target.value)}
            className="slider"
            id="tempo"
          />
          <button
            className={
              isPlaying ? "playback-button playing" : "playback-button"
            }
            onClick={handlePlayback}
          >
            PLAY
          </button>
        </div>
        <div className="chord-title">
          {
            // Drum Sets
          }
          <span>Drum Set:</span>
        </div>
        {!imported && track.length === 0 ? (
          <div className="chord-display drumset">
            <button
              className="drumset-button"
              value="0"
              disabled={drumSet === 0 && "disabled"}
              onClick={handleDrumset}
            >
              Heater
            </button>
            <button
              className="drumset-button"
              value="1"
              disabled={drumSet === 1 && "disabled"}
              onClick={handleDrumset}
            >
              Piano
            </button>
          </div>
        ) : (
          <div className="chord-display drumset">
            <button className="drumset-button drumset-button-solo" disabled>
              {drumSet === 0 ? "Heater" : "Piano"}
            </button>
          </div>
        )}

        {
          // IMPORT / EXPORT
        }
        <div className="chord-title">
          <span>Share:</span>
        </div>
        {!imported ? (
          <div className="chord-display share">
            <div>
              <p className="text">Export URL:</p>
            </div>
            <div>
              <input
                id="export-input"
                type="text"
                className="export-input"
                value={
                  exportURL[0].length === 0
                    ? HOME_URL
                    : HOME_URL + btoa(JSON.stringify(exportURL)) + "?"
                }
                readOnly
              />
            </div>
            <div>
              <button
                id="copy-button"
                className="copy-button"
                onClick={copyUrl}
                disabled={exportURL[0].length === 0 && "disabled"}
              >
                Copy URL
              </button>
            </div>
          </div>
        ) : (
          <div className="chord-display share">
            <div></div>
            <div>
              <p className="text nomargin">Track Imported!</p>
            </div>
            <div></div>
          </div>
        )}
      </div>
      {
        // DRUMS
      }
      <div id="drum-machine">{drumPads}</div>
      <div id="display" className="display">
        {
          // Information Panel
        }
        <div className="chord-title">
          <span>Drum:</span> <br />
        </div>
        <div className="chord-display">
          <span className="chord">{chord}</span>
        </div>
        <div className="chord-title">
          <span>Track:</span> <br />
        </div>
        <div
          className={
            track.length < MAX_TRACK_LENGTH
              ? "track-display"
              : "track-display error"
          }
        >
          <span className="track">{track + ""}</span>
        </div>
        <button
          className="reset"
          onClick={() => {
            setTrack([]);
            setChordTime([]);
            setChord(null);
            setTempo(DEFAULT_TEMPO);
            setExportURL([[], [], drumSet]);
            setImported(false);
            setResetPressed(true);
          }}
        >
          RESET
        </button>
        <Key keys={keys} handleClick={handleClick} />
      </div>
    </div>
  );
}

export default DrumMachine;
