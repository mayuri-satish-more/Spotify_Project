let currentSong = new Audio();
let songs = [];
let currFolder;

function secondsToMinuteSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${paddedMinutes}:${paddedSeconds}`;
}

async function getSongs(folder) {
  currFolder = folder;
  console.log(`Fetching songs from folder: ${folder}`);
  let a = await fetch(`http://127.0.0.1:5500/${folder}/`);
  // let a = await fetch(`/${folder}/`)
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");
  songs = [];
  for (let index = 0; index < as.length; index++) {
    const element = as[index];
    if (element.href.endsWith(".mp3")) {
      songs.push(decodeURIComponent(element.href.split(`/${folder}/`)[1]));
    }
  }

  let songUL = document.querySelector(".songList ul");
  songUL.innerHTML = "";
  songs.forEach((song) => {
    songUL.innerHTML += `
            <li>
                <img class="invert" src="img/music.svg" alt="Music Icon">
                <div class="info">
                    <div>${song}</div>
                    <div>mayuri</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="img/play.svg" alt="Play Icon">
                </div>
            </li>`;
  });

  Array.from(document.querySelectorAll(".songList li")).forEach((e) => {
    e.addEventListener("click", () => {
      playMusic(e.querySelector(".info").firstElementChild.innerHTML);
    });
  });

  return songs;
}

const playMusic = (track, pause = false) => {
  currentSong.src = `/${currFolder}/` + encodeURIComponent(track);
  if (!pause) {
    currentSong.play();
    document.getElementById("play").src = "img/pause.svg";
  }
  document.querySelector(".songinfo").innerHTML = track;
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

  currentSong.addEventListener("loadedmetadata", () => {
    document.querySelector(
      ".songtime"
    ).innerHTML = `00:00 / ${secondsToMinuteSeconds(currentSong.duration)}`;
  });
};

async function displayAlbums() {
  let a = await fetch(`http://127.0.0.1:5500/songs`);
  //   let a = await fetch(`/songs/`);
  let response = await a.text();

  let div = document.createElement("div");
  div.innerHTML = response;
  let anchors = div.getElementsByTagName("a");
  let cardContainer = document.querySelector(".cardContainer");
  let array = Array.from(anchors);
  for (let index = 0; index < array.length; index++) {
    const e = array[index];
    if (e.href.includes("/songs/")) {
      //   let folder = decodeURIComponent(e.href.split("/").slice(-2)[1].trim());
      //   let folder = e.href.split("/").slice(-2)[1].trim();
      //   let folder = "mayuri";
      let folder = e.href.split("/").slice(-2)[1];

      let a = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
      //   let a = await fetch(`/songs/${folder}/info.json`);
      let response = await a.json();
      cardContainer.innerHTML += ` 
             <div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="40" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <g transform="translate(25, 25) scale(2.0833)">
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="#000000"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z"
                                            stroke="black" stroke-width="1.5" stroke-linejoin="round" />
                                    </svg>
                                </g>
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="">
                        <h2>${response.title}</h2>
                        <p>${response.description}</p>
                    </div>`;
    }
  }

  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      const folder = item.currentTarget.dataset.folder.trim();
      const songs = await getSongs(`songs/${folder}`);
      playMusic(songs[0]);
    });
  });
}

async function main() {
  await getSongs("songs/mayuri");
  playMusic(songs[0], true);

  await displayAlbums();

  document.getElementById("play").addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      document.getElementById("play").src = "img/pause.svg";
    } else {
      currentSong.pause();
      document.getElementById("play").src = "img/play.svg";
    }
  });

  function playNextSong() {
    let index = songs.indexOf(
      decodeURIComponent(currentSong.src.split("/").slice(-1)[0])
    );
    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    } else {
      // Optionally, you could loop back to the first song if you want continuous playback
      playMusic(songs[0]);
    }
  }

  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `${secondsToMinuteSeconds(
      currentSong.currentTime
    )} / ${secondsToMinuteSeconds(currentSong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });
  currentSong.addEventListener("ended", playNextSong);

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  document.getElementById("previous").addEventListener("click", () => {
    let index = songs.indexOf(
      decodeURIComponent(currentSong.src.split("/").slice(-1)[0])
    );
    if (index - 1 >= 0) {
      playMusic(songs[index - 1]);
    }
  });

  document.getElementById("next").addEventListener("click", () => {
    let index = songs.indexOf(
      decodeURIComponent(currentSong.src.split("/").slice(-1)[0])
    );
    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    }
  });

  document.querySelector(".range input").addEventListener("change", (e) => {
    currentSong.volume = parseInt(e.target.value) / 100;
  });

  document.querySelector(".volume > img").addEventListener("click", (e) => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currentSong.volume = 0;
      document.querySelector(".range input").value = 0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      currentSong.volume = 0.1;
      document.querySelector(".range input").value = 10;
    }
  });
}

main();
