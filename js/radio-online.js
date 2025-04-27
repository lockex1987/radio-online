// https://vovmedia.vn/vov2
// https://vietnamradio.org/
// https://radioau.net/
// https://instant.audio/
// https://nochev.github.io/hls.js/docs/html/

const { createApp, ref, reactive, onMounted } = Vue
// import { createApp, ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

const App = {
    setup() {
        const stationList = [
            /*
            { name: 'VOV 1', link: 'https://stream-cdn.vov.vn/live/vov1-audio_only.m3u8', logo: 'logo/vov1.webp' },
            { name: 'VOV 2', link: 'https://stream-cdn.vov.vn/live/vov2-audio_only.m3u8', logo: 'logo/vov2.webp' },
            { name: 'VOV 3', link: 'https://stream-cdn.vov.vn/live/vov3-audio_only.m3u8', logo: 'logo/vov3.webp' },
            { name: 'VOV 5 World', link: 'https://stream-cdn.vov.vn/live/vov5-audio_only.m3u8', logo: 'logo/vov5.webp' },
            */
            { name: 'VOV 1', link: 'https://stream.vovmedia.vn/vov-1', logo: 'logo/vov1.webp' },
            { name: 'VOV 2', link: 'https://stream.vovmedia.vn/vov-2', logo: 'logo/vov2.webp' },
            { name: 'VOV 3', link: 'https://stream.vovmedia.vn/vov-3', logo: 'logo/vov3.webp' },
            { name: 'VOV 5 World', link: 'https://stream.vovmedia.vn/vov-5', logo: 'logo/vov5.webp' },
            { name: 'VOH FM 99.9 Mhz', link: 'https://strm.voh.com.vn/radio/channel3/playlist.m3u8', logo: 'logo/voh-fm-99.9mhz.png' },
            { name: 'Hải Dương', link: 'https://live.haiduongtv.vn/live/2858f932f24fa494996afb93ae0a7896ef9/playlist.m3u8', logo: 'logo/hai-duong.png' },
            // { name: 'Cần Thơ', link: 'https://live.canthotv.vn/live/radio/playlist.m3u8', logo: 'logo/can-tho.png' },
            // { name: 'Hanoi FM 90', link: 'https://cloudcdnfm90.tek4tv.vn/HANOIFM90/stream.m3u8', logo: 'logo/hanoi-fm90.png' },
            // { name: 'Hanoi FM 96', link: 'https://cloudcdnfm90.tek4tv.vn/HANOI96/stream.m3u8', logo: 'logo/hanoi-fm96.png' },
        ]
        let currentIndex = localStorage.getItem('currentIndex') ? parseInt(localStorage.getItem('currentIndex')) : 0
        if (currentIndex >= stationList.length) {
            currentIndex = 0
        }
        const currentStation = ref(stationList[currentIndex])

        let hls
        let audio
        let context
        let analyser
        let visualizerTracks
        let togglePlayBtn

        const togglePlayer = () => {
            if (!context) {
                prepareAnalyser()
            }

            if (audio.paused) {
                playAudio()
            } else {
                pauseAudio()
            }
        }

        // Không được gọi luôn, phải chờ hành động của người dùng, nếu không sẽ không nghe được âm thanh
        // Nếu là dạng src aacp thì sẽ không nghe được
        // https://codepen.io/KACTOPKA/pen/dyqwdPX
        const prepareAnalyser = () => {
            context = new AudioContext()
            analyser = context.createAnalyser()
            // analyser.fftSize = 2048

            const src = context.createMediaElementSource(audio)
            src.connect(analyser)
            analyser.connect(context.destination)
        }

        const playAudio = () => {
            audio.play()
            togglePlayBtn.innerHTML = `<svg viewBox="0 0 448 512" title="pause"><path d="M144 479H48c-26.5 0-48-21.5-48-48V79c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zm304-48V79c0-26.5-21.5-48-48-48h-96c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48z" /></svg>`
        }

        const pauseAudio = () => {
            audio.pause()
            togglePlayBtn.innerHTML = `<svg viewBox="0 0 448 512" title="play"><path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z" /></svg>`
        }

        // Cần đảm bảo chỉ chạy một luồng
        const loopVisualization = () => {
            if (!audio.paused && context && analyser) {
                const dataArray = new Uint8Array(analyser.frequencyBinCount)
                analyser.getByteFrequencyData(dataArray)
                // console.log(visualizerTracks.length, dataArray.length)
                // const gap = Math.floor(dataArray.length / visualizerTracks.length)
                const gap = 5
                const ratio = 0.39215686274

                // TODO: Sử dụng canvas
                // https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
                for (let i = 0; i < visualizerTracks.length; i++) {
                    visualizerTracks[i].style.height = (dataArray[i * gap] * ratio) + '%'
                }
            }

            window.requestAnimationFrame(loopVisualization)
        }

        initHlsOrAudio = (url) => {
            if (url.endsWith('.m3u8')) {
                audio.removeAttribute('type')
                audio.removeAttribute('src')
                if (!hls) {
                    hls = new Hls()
                    hls.attachMedia(audio)
                }
                hls.loadSource(url)
            } else {
                if (hls) {
                    // hls.off(Hls.Events.MEDIA_ATTACHED, onMediaAttached)
                    // hls.off(Hls.Events.MANIFEST_PARSED, onManifestParsed)
                    hls.detachMedia()
                    hls.destroy()
                    hls = null
                }
                audio.setAttribute('type', 'audio/aac')
                audio.src = url
                // audio.setAttribute('type', 'audio/mp3')
                // audio.src = 'https://cdn.pixabay.com/download/audio/2023/03/01/audio_74accea696.mp3?filename=trap-beat-dark-autumn-night-141114.mp3'
            }
        }

        const changeStation = (station, index) => {
            const url = station.link
            currentStation.value = station

            initHlsOrAudio(url)

            if (!context) {
                prepareAnalyser()   
            }

            if (audio.paused) {
                playAudio()
            }

            localStorage.setItem('currentIndex', '' + index)
        }

        onMounted(() => {
            audio = document.querySelector('#player')

            // Phải thêm cái này thì mới nghe được âm thanh và visualyser
            audio.crossOrigin = 'anonymous'

            // audio.src = currentStation.value.link

            const url = currentStation.value.link

            initHlsOrAudio(url)

            /*
            let isFirstTime = true
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('Parsed')
                if (isFirstTime) {
                    isFirstTime = false
                } else {
                    audio.play()
                }
            })
            */

            visualizerTracks = document.querySelectorAll('#visualizer .track')
            togglePlayBtn = document.getElementById('toggle-play')
            togglePlayBtn.addEventListener('click', togglePlayer)

            loopVisualization()

            audio.addEventListener('timeupdate', () => {
                // console.log(audio.currentTime, audio.duration)
                /*
                if (!isNaN(duration)) {
                    const minutes = Math.floor(duration / 60);
                    const seconds = Math.floor(duration % 60);
                    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    totalTimeDisplay.textContent = formattedTime;
                }
                */
            })

            audio.addEventListener('play', () => {
                if (!context) {
                    prepareAnalyser()
                }
                // playPauseButton.textContent = 'Pause'
                // playing = true
            })
          
            audio.addEventListener('pause', () => {
                // playPauseButton.textContent = 'Play'
                // playing = false
            })

            /*
            audio.addEventListener('loadedmetadata', () => {
                console.log(audio.duration)
            })
            */
            /*
            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                // const audio = hls.media
                audio.addEventListener('loadedmetadata', () => {
                    const totalDuration = audio.duration
                    console.log('Total duration:', totalDuration)
                })
            })
              
            hls.on(Hls.Events.LEVEL_LOADED, (evt, data) => {
                console.log(evt, data)
                const currentDuration = data.details.totalduration
                console.log('Current playlist duration:', currentDuration)
            })
            */
        })

        return {
            stationList,
            currentStation,
            changeStation
        }
    }
}

const app = createApp(App)
app.mount('#app')