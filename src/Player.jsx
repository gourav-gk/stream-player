import React, { useRef, useEffect, useState } from "react";
import "./styles.css";
import Hls from "hls.js";
let activePlayerId = null; // Global tracker

const Player = ({
  id,
  src,
  poster,
  captions = null,
  previewImg = null,
  width = "900px",
  maxHeight = "60vh",
  setting = false,
  backgroundColor = "#000",
  theater = false,
}) => {
  const videoRef = useRef(null),
    playerRef = useRef(null),
    timelineRef = useRef(null);
  const volumeSliderRef = useRef(null),
    previewImgRef = useRef(null),
    thumbnailImgRef = useRef(null),
    speedBtnRef = useRef(null);
  const isScrubbingRef = useRef(false),
    wasPausedRef = useRef(false);

  const handleActivate = (e) => {
    activePlayerId = id; // This player becomes active
    e.currentTarget.focus();
  };

  const handleDeactivate = () => {
    if (activePlayerId === id) activePlayerId = null;
  };

  const [state, setState] = useState({
    captionsVisible: false,
    isPaused: true,
    isTheater: false,
    isFullscreen: false,
    volume: 1,
    duration: "0:00",
    currentTime: "0:00",
    progress: 0,
    volumeLevel: "high",
  });

  const formatTime = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

  const updateState = (updates) => setState((prev) => ({ ...prev, ...updates }));

  const togglePlayPause = () => {
    const v = videoRef.current;
    v[v.paused ? "play" : "pause"]();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen();
      updateState({ isFullscreen: true });
    } else {
      document.exitFullscreen();
      updateState({ isFullscreen: false });
    }
  };

  const skip = (duration) => {
    videoRef.current.currentTime += duration;
  };

  const toggleMute = () => {
    const v = videoRef.current;
    const vol = v.volume ? 0 : state.volume;
    v.volume = vol;
    updateState({ volumeLevel: vol === 0 ? "muted" : vol < 0.5 ? "low" : "high" });
  };

  const toggleTheater = () => updateState({ isTheater: !state.isTheater });

  const toggleMiniPlayerMode = async () => {
    const v = videoRef.current;
    try {
      document.pictureInPictureElement
        ? await document.exitPictureInPicture()
        : await v.requestPictureInPicture();
    } catch (err) {
      console.error("PiP Error:", err);
    }
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    videoRef.current.volume = v;
    updateState({ volume: v, volumeLevel: v === 0 ? "muted" : v < 0.5 ? "low" : "high" });
  };

  const handleTimelineClick = (e) => {
    const v = videoRef.current;
    const { left, width } = timelineRef.current.getBoundingClientRect();
    v.currentTime = ((e.clientX - left) / width) * v.duration;
  };

  function stepVolume(step) {
    if (videoRef.current.volume + step <= 1 && videoRef.current.volume + step >= 0) {
      const v = parseFloat((videoRef.current.volume += step));
      updateState({ volume: v, volumeLevel: v === 0 ? "muted" : v < 0.5 ? "low" : "high" });
    }
  }

  const toggleCaptions = () => {
    const t = videoRef.current.textTracks;
    if (t.length) {
      const mode = t[0].mode === "showing" ? "hidden" : "showing";
      t[0].mode = mode;
      updateState({ captionsVisible: mode === "showing" });
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    const update = () => {
      updateState({
        currentTime: formatTime(v.currentTime),
        progress: v.currentTime / v.duration,
      });
    };
    const setDur = () => updateState({ duration: formatTime(v.duration) });
    const setPlay = () => updateState({ isPaused: v.paused });

    v.addEventListener("timeupdate", update);
    v.addEventListener("loadedmetadata", setDur);
    v.addEventListener("play", setPlay);
    v.addEventListener("pause", setPlay);

    return () => {
      v.removeEventListener("timeupdate", update);
      v.removeEventListener("loadedmetadata", setDur);
      v.removeEventListener("play", setPlay);
      v.removeEventListener("pause", setPlay);
    };
  }, []);

  useEffect(() => {
    const keyHandler = (e) => {
      if (activePlayerId !== id) return;
      if (
        [
          " ",
          "f",
          "t",
          "i",
          "m",
          "c",
          "k",
          "l",
          "j",
          "ArrowRight",
          "ArrowLeft",
          "ArrowUp",
          "ArrowDown",
        ].includes(e.key)
      ) {
        e.preventDefault();
        if (e.key === " " || e.key === "k") togglePlayPause();
        else if (e.key === "f") toggleFullscreen();
        else if (e.key === "t" && theater) toggleTheater();
        else if (e.key === "i") toggleMiniPlayerMode();
        else if (e.key === "m") toggleMute();
        else if (e.key === "c") toggleCaptions();
        else if (e.key === "l" || e.key === "ArrowRight") skip(5);
        else if (e.key === "j" || e.key === "ArrowLeft") skip(-5);
        else if (e.key === "ArrowUp") stepVolume(0.1);
        else if (e.key === "ArrowDown") stepVolume(-0.1);
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [id]);

  useEffect(() => {
    if (previewImg) {
      const v = videoRef.current,
        t = timelineRef.current,
        container = playerRef.current;

      const updateTimeline = (e) => {
        if (!t || !v.duration) return;
        const { x, width } = t.getBoundingClientRect();
        const percent = Math.min(Math.max(0, e.clientX - x), width) / width;
        const imgNum = Math.max(1, Math.floor((percent * v.duration) / 10));
        const imgSrc = `${previewImg}${imgNum}.jpg`;

        previewImgRef.current.src = imgSrc;
        t.style.setProperty("--preview-position", percent);
        if (isScrubbingRef.current) {
          e.preventDefault();
          thumbnailImgRef.current.src = imgSrc;
          t.style.setProperty("--progress-position", percent);
        }
      };

      const toggleScrub = (e) => {
        const { x, width } = t.getBoundingClientRect();
        const percent = Math.min(Math.max(0, e.clientX - x), width) / width;
        const scrub = (e.buttons & 1) === 1;
        isScrubbingRef.current = scrub;
        container.classList.toggle("scrubbing", scrub);
        if (scrub) {
          wasPausedRef.current = v.paused;
          v.pause();
        } else {
          v.currentTime = percent * v.duration;
          if (!wasPausedRef.current) v.play();
        }
        updateTimeline(e);
      };

      const move = (e) => isScrubbingRef.current && updateTimeline(e);
      const up = (e) => isScrubbingRef.current && toggleScrub(e);

      t.addEventListener("mousemove", updateTimeline);
      t.addEventListener("mousedown", toggleScrub);
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);

      return () => {
        t.removeEventListener("mousemove", updateTimeline);
        t.removeEventListener("mousedown", toggleScrub);
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
      };
    }
  }, []);

  useEffect(() => {
    const v = videoRef.current,
      t = timelineRef.current;
    const animate = () => {
      if (v && t && !isScrubbingRef.current) {
        t.style.setProperty("--progress-position", v.currentTime / v.duration);
      }
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const v = videoRef.current,
      btn = speedBtnRef.current;
    const changeSpeed = () => {
      let rate = v.playbackRate + 0.25;
      if (rate > 2) rate = 0.25;
      v.playbackRate = rate;
      btn.textContent = `${rate}x`;
    };
    btn.addEventListener("click", changeSpeed);
    return () => btn.removeEventListener("click", changeSpeed);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    let hls;

    if (!src) return;

    // 🔍 If it's an HLS stream (.m3u8)
    if (src.toLowerCase().includes(".m3u8")) {
      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS support
        video.src = src;
      }
    } else {
      // 🎞️ Regular MP4 or other video type
      video.src = src;
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [src]);

  return (
    <div
      className={`parent-player ${state.isTheater ? "theater" : ""}`}
      style={{
        width: width,
        maxHeight: maxHeight,
      }}
    >
      <div
        ref={playerRef}
        tabIndex={0}
        style={{ backgroundColor }}
        onClick={handleActivate}
        onFocus={handleActivate}
        onBlur={handleDeactivate}
        className={`video-container ${state.isFullscreen ? "full-screen" : ""} ${
          state.isTheater ? "theater" : ""
        } ${state.captionsVisible ? "captions" : ""}`}
      >
        <img ref={thumbnailImgRef} className="thumbnail-img" />
        <div className="video-controls-container">
          {/* fss */}
          <div className="setting-box">
            <div className="setting-tab" style={{ marginTop: "10px" }} tab-for="quality">
              <div className="icon">
                <svg height="24" viewBox="0 -4 24 24" width="24">
                  <path
                    d="M15,17h6v1h-6V17z M11,17H3v1h8v2h1v-2v-1v-2h-1V17z M14,8h1V6V5V3h-1v2H3v1h11V8z            M18,5v1h3V5H18z M6,14h1v-2v-1V9H6v2H3v1 h3V14z M10,12h11v-1H10V12z"
                    fill="white"
                  ></path>
                </svg>
              </div>
              <div className="text">Quality</div>
              <div className="val" id="quality-val">
                720
              </div>
            </div>

            <div className="setting-tab" tab-for="speed">
              <div className="icon">
                <svg height="24" viewBox="0 -2 24 24" width="24">
                  <path
                    d="M10,8v8l6-4L10,8L10,8z M6.3,5L5.7,4.2C7.2,3,9,2.2,11,2l0.1,1C9.3,3.2,7.7,3.9,6.3,5z            M5,6.3L4.2,5.7C3,7.2,2.2,9,2,11 l1,.1C3.2,9.3,3.9,7.7,5,6.3z            M5,17.7c-1.1-1.4-1.8-3.1-2-4.8L2,13c0.2,2,1,3.8,2.2,5.4L5,17.7z            M11.1,21c-1.8-0.2-3.4-0.9-4.8-2 l-0.6,.8C7.2,21,9,21.8,11,22L11.1,21z            M22,12c0-5.2-3.9-9.4-9-10l-0.1,1c4.6,.5,8.1,4.3,8.1,9s-3.5,8.5-8.1,9l0.1,1 C18.2,21.5,22,17.2,22,12z"
                    fill="white"
                  ></path>
                </svg>
              </div>
              <div className="text">Playback Speed</div>
              <div className="val" id="speed-val">
                1
              </div>
            </div>
          </div>
          <div className="timeline-container">
            <div className="timeline" ref={timelineRef} onClick={handleTimelineClick}>
              {previewImg && <img ref={previewImgRef} className="preview-img" />}
              <div className="thumb-indicator"></div>
            </div>
          </div>
          <div className="controls">
            <button className="play-pause-btn" onClick={togglePlayPause}>
              {state.isPaused ? (
                <svg className="play-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                </svg>
              ) : (
                <svg className="pause-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M14,19H18V5H14M6,19H10V5H6V19Z" />
                </svg>
              )}
            </button>
            <div className="volume-container">
              <button className="mute-btn" onClick={toggleMute}>
                {state.volumeLevel === "high" && (
                  <svg className="volume-high-icon" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"
                    />
                  </svg>
                )}

                {state.volumeLevel === "low" && (
                  <svg className="volume-low-icon" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M5,9V15H9L14,20V4L9,9M18.5,12C18.5,10.23 17.5,8.71 16,7.97V16C17.5,15.29 18.5,13.76 18.5,12Z"
                    />
                  </svg>
                )}

                {state.volumeLevel === "muted" && (
                  <svg className="volume-muted-icon" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z"
                    />
                  </svg>
                )}
              </button>
              <input
                className="volume-slider"
                type="range"
                min="0"
                max="1"
                step="any"
                value={state.volume}
                onChange={handleVolumeChange}
                ref={volumeSliderRef}
              />
            </div>
            <div className="duration-container">
              <div className="current-time">{state.currentTime}</div>/
              <div className="total-time">{state.duration}</div>
            </div>
            <button className="speed-btn wide-btn" ref={speedBtnRef} data-speed>
              1x
            </button>
            {captions && (
              <button className="captions-btn" onClick={toggleCaptions}>
                <svg viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M18,11H16.5V10.5H14.5V13.5H16.5V13H18V14A1,1 0 0,1 17,15H14A1,1 0 0,1 13,14V10A1,1 0 0,1 14,9H17A1,1 0 0,1 18,10M11,11H9.5V10.5H7.5V13.5H9.5V13H11V14A1,1 0 0,1 10,15H7A1,1 0 0,1 6,14V10A1,1 0 0,1 7,9H10A1,1 0 0,1 11,10M19,4H5C3.89,4 3,4.89 3,6V18A2,2 0 0,0 5,20H19A2,2 0 0,0 21,18V6C21,4.89 20.1,4 19,4Z"
                  />
                </svg>
              </button>
            )}

            {setting && (
              <button className="setting-btn">
                <svg viewBox="7 7 24 24">
                  <path
                    d="m 23.94,18.78 c .03,-0.25 .05,-0.51 .05,-0.78 0,-0.27 -0.02,-0.52 -0.05,-0.78 l 1.68,-1.32 c .15,-0.12 .19,-0.33 .09,-0.51 l -1.6,-2.76 c -0.09,-0.17 -0.31,-0.24 -0.48,-0.17 l -1.99,.8 c -0.41,-0.32 -0.86,-0.58 -1.35,-0.78 l -0.30,-2.12 c -0.02,-0.19 -0.19,-0.33 -0.39,-0.33 l -3.2,0 c -0.2,0 -0.36,.14 -0.39,.33 l -0.30,2.12 c -0.48,.2 -0.93,.47 -1.35,.78 l -1.99,-0.8 c -0.18,-0.07 -0.39,0 -0.48,.17 l -1.6,2.76 c -0.10,.17 -0.05,.39 .09,.51 l 1.68,1.32 c -0.03,.25 -0.05,.52 -0.05,.78 0,.26 .02,.52 .05,.78 l -1.68,1.32 c -0.15,.12 -0.19,.33 -0.09,.51 l 1.6,2.76 c .09,.17 .31,.24 .48,.17 l 1.99,-0.8 c .41,.32 .86,.58 1.35,.78 l .30,2.12 c .02,.19 .19,.33 .39,.33 l 3.2,0 c .2,0 .36,-0.14 .39,-0.33 l .30,-2.12 c .48,-0.2 .93,-0.47 1.35,-0.78 l 1.99,.8 c .18,.07 .39,0 .48,-0.17 l 1.6,-2.76 c .09,-0.17 .05,-0.39 -0.09,-0.51 l -1.68,-1.32 0,0 z m -5.94,2.01 c -1.54,0 -2.8,-1.25 -2.8,-2.8 0,-1.54 1.25,-2.8 2.8,-2.8 1.54,0 2.8,1.25 2.8,2.8 0,1.54 -1.25,2.8 -2.8,2.8 l 0,0 z"
                    fill="currentColor"
                  ></path>
                </svg>
              </button>
            )}

            <button className="mini-player-btn" onClick={toggleMiniPlayerMode}>
              <svg viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-10-7h9v6h-9z"
                />
              </svg>
            </button>
            {theater && (
              <button className="theater-btn" onClick={toggleTheater}>
                <svg className="tall" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8z"
                  />
                </svg>
                <svg className="wide" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M19 7H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 8H5V9h14v6z"
                  />
                </svg>
              </button>
            )}
            <button className="full-screen-btn" onClick={toggleFullscreen}>
              <svg className="open" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
                />
              </svg>
              <svg className="close" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"
                />
              </svg>
            </button>
          </div>
        </div>
        <video ref={videoRef} className="video" poster={poster} onClick={togglePlayPause}>
          {captions && <track kind="captions" srcLang={captions[0].lang} src={captions[0].src} />}
        </video>
      </div>
    </div>
  );
};

export default Player;
