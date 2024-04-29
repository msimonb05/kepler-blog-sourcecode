// main fetch API for NASA APOD
function fetchAPOD() {
    const API_URL = "https://api.nasa.gov/planetary/apod?api_key=KOceofKPEAThv1or1LraghbeIFlthNZIt3XhlPci"; // NASA APOD API key and url

    // display loading screen
    const load = updateLoading(document.getElementById("loading"));
    const interval = setInterval(load, 500);
    // fetch data from NASA APOD API
    fetch(API_URL)
    .then(response => response.json())
    .then(data => {
        // stop updating + hide loading screen
        clearInterval(interval);
        document.getElementById("loading").style.display = "none";

        const title = data.title;
        const copyright = data.copyright;
        const date = new Date(data.date);
        const formattedDate = formatDate(date); // format date from aforementioned function
        const desc = data.explanation;
        const imgURL = data.url;
        const videoURL = data.url;
            
            if (data.media_type === "video") { // occurs if APOD is a video
                
                // regex values
                const videoIdMatch = videoURL.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                const videoId = videoIdMatch[1];

                // embeds youtube video in website
                const embedURL = `https://www.youtube.com/embed/${videoId}`;
                const iframe = document.createElement("iframe");
                iframe.setAttribute("src", embedURL);
                iframe.setAttribute("width", "840");
                iframe.setAttribute("height", "472.5");
                iframe.setAttribute("frameborder", "0");
                iframe.setAttribute("allowfullscreen", "");
                
                // places vid in daily-img
                const videoContainer = document.getElementById("img");
                videoContainer.appendChild(iframe);
            } else { // occurs if APOD is a picture
                document.getElementById("img").innerHTML = "<img src=\"" + imgURL + "\" alt=\"" + title + "\" title=\"" + title + "\">"; // adds this tag to the div class with id="img"
            }

            document.getElementById("title").innerText = title;

            if (data.copyright) { // if author / copyright is undefined, do not display
                document.getElementById("copyright").innerText = copyright;
            }

            document.getElementById("date").innerText = formattedDate; // displays formatted date
            document.getElementById("desc").innerText = desc; 
            document.getElementById("imgURL").innerText =  "Source: " + imgURL;
        })
        .catch(error => {
            console.error("Error: ", error);
        });
}

// main fetch API for MapTiler Weather SDK for Maps
function fetchMapTiler() {
    const timeInfoContainer = document.getElementById("time-info");
    const timeTextDiv = document.getElementById("time-text");
    const timeSlider = document.getElementById("time-slider");
    const playPauseButton = document.getElementById("play-pause-bt");
    const pointerDataDiv = document.getElementById("pointer-data");
    let pointerLngLat = null;

    maptilersdk.config.apiKey = '7g9joJSMEoSoWl3RXNA4';

    const map = new maptilersdk.Map({
        container: document.getElementById('map'),
        hash: true,
        zoom: 2,
        center: [0, 40],
        style: maptilersdk.MapStyle.BACKDROP,
    });

    const layerBg = new maptilerweather.TemperatureLayer({
        opacity: 0.8,
    });

    const layer = new maptilerweather.WindLayer({
        id: "Wind Particles",
        colorramp: maptilerweather.ColorRamp.builtin.NULL,
        speed: 0.001,
        fadeFactor: 0.03,
        maxAmount: 256,
        density: 200,
        color: [0, 0, 0, 30],
        fastColor: [0, 0, 0, 100],
    });

    console.log('layer', layer);

    map.on('load', function () {
      // darkening the water layer to make the land stand out
        map.setPaintProperty("Water", 'fill-color', "rgba(0, 0, 0, 0.6)");
        map.addLayer(layer);
        map.addLayer(layerBg, "Water");

    });

    timeSlider.addEventListener("input", (evt) => {
        layer.setAnimationTime(parseInt(timeSlider.value / 1000))
        layerBg.setAnimationTime(parseInt(timeSlider.value / 1000))
    })

    // event called when all the datasource for the next days are added and ready
    // layer nows the start and end dates
    layer.on("sourceReady", event => {
        const startDate = layer.getAnimationStartDate();
        const endDate = layer.getAnimationEndDate();
        const currentDate = layer.getAnimationTimeDate();
        refreshTime()

        timeSlider.min = +startDate;
        timeSlider.max = +endDate;
        timeSlider.value = +currentDate;
    })

    // called when the animation is progressing
    layer.on("tick", event => {
        refreshTime();
        updatePointerValue(pointerLngLat);
    })

    // called when the time is manually set
    layer.on("animationTimeSet", event => {
        refreshTime()
    })

    // clicking on the play/pause
    let isPlaying = false;
    playPauseButton.addEventListener("click", () => {
        if (isPlaying) {
        layer.animateByFactor(0);
        layerBg.animateByFactor(0);
        playPauseButton.innerText = "Play 3600x";
        } else {
        layer.animateByFactor(3600);
        layerBg.animateByFactor(3600);
        playPauseButton.innerText = "Pause";
        }

        isPlaying = !isPlaying;
    })

    // update date & time display
    function refreshTime() {
        const d = layer.getAnimationTimeDate();
        timeTextDiv.innerText = d.toString();
        timeSlider.value = +d;
    }

    function updatePointerValue(lngLat) {
        if (!lngLat) return;
        pointerLngLat = lngLat;
        const valueWind = layer.pickAt(lngLat.lng, lngLat.lat);
        const valueTemp = layerBg.pickAt(lngLat.lng, lngLat.lat);
        if (!valueWind) {
            pointerDataDiv.innerText = "";
            return;
        }
        pointerDataDiv.innerHTML = `
            <div>
                <span style="font-size: 1em;">${valueTemp.value.toFixed(1)}°C</span> 
                <span style="font-size: 0.6em;">(${valueTemp.valueImperial.toFixed(1)}°F)</span>
            </div>
            <div>
                <span style="font-size: 1em;">${valueWind.speedKilometersPerHour.toFixed(1)} km/h</span>
                <span style="font-size: 0.6em;">(${valueWind.speedMilesPerHour.toFixed(1)} mi/h)</span>
            </div>
        `;
    }

    timeInfoContainer.addEventListener("mouseenter", () => {
        pointerDataDiv.innerText = "";
    })

    map.on('mousemove', (e) => {
        updatePointerValue(e.lngLat);
    });
}

function updateLoading(loading) {
    // update ellipses
    let count = 0;
    function update() {
        const ellipses = ".".repeat(count);
        loading.innerText = `Loading${ellipses}`;
        count = (count === 3) ? 0 : count + 1;
    }
    // display "Loading" with ellipses
    update();
    loading.style.display = "flex";
    loading.style.alignItems = "center";
    loading.style.justifyContent = "center";
    return update;
}

// scroll to top
document.addEventListener("DOMContentLoaded", function () {
    var scrollToTopButton = document.getElementById("back-to-top");

    scrollToTopButton.addEventListener("click", function() {
        window.scrollTo({top: 0, behavior: "smooth"});
    });
});

// navigate to NASA APOD in services page
function APODButton() {
    window.location.href = "services.html#daily-nasa-image-&-fact";
}

// navigate to weather interactive map in services page
function weatherButton() {
    window.location.href = "services.html#global-heat-&-index";
}

// navigate to blogs in services page
function blogButton() {
    window.location.href = "services.html#blogs";
}

// formats date from the fetch API
function formatDate(date) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const suffix = ['st', 'nd', 'rd', 'th'];

    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    // adds appropriate suffix for the day
    let suffixDay = (day >= 11 && day <= 13) ? "th" : (suffix[(day - 1) % 10] || "th");

    // returns appropriate values to format the fetched API
    return `${day}${suffixDay} of ${month}, ${year}`;
}

// real time clock and date
function timeDate() {
    // values for time
    let rtTimeDate = new Date();
    let hour = rtTimeDate.getHours();
    let min = rtTimeDate.getMinutes();
    let sec = rtTimeDate.getSeconds();
    
    // values for date
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const suffix = ['st', 'nd', 'rd', 'th'];
    let day = rtTimeDate.getDate();
    let month = monthNames[rtTimeDate.getMonth()];
    let year = rtTimeDate.getFullYear();

    // assigned time logic
    let meridian = (hour < 12) ? "AM" : "PM";
    hour = (hour % 12 || 12);
    hour = ("0" + hour).slice(-2);
    min = ("0" + min).slice(-2);
    sec = ("0" + sec).slice(-2);

    // assigned date logic
    let suffixDay = (day >= 11 && day <= 13) ? "th" : (suffix[(day - 1) % 10] || "th");
    let date = `${day}${suffixDay} of ${month}, ${year}`;

    // display time and date
    document.getElementById("timeDate").innerText = `${hour} : ${min} : ${sec} ${meridian}\n${date}`;
    setTimeout(timeDate, 500);
}

// load all necessary functions
window.onload = function() {
    fetchAPOD();
    fetchMapTiler();
    timeDate();
}