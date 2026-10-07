/**
 * ==============================================================================
 * WeatherNow - Live Weather Dashboard & Forecast Engine
 * Vanilla JavaScript Implementation
 * ==============================================================================
 * 
 * Instructions for API Key Configuration:
 * 1. Sign up for a free account at OpenWeatherMap: https://openweathermap.org/
 * 2. Navigate to your API keys page: https://home.openweathermap.org/api_keys
 * 3. Copy your 32-character key and paste it below into the `API_KEY` constant.
 * 
 * Alternatively, you can use the "API Key" button in the website header to
 * test your key interactively without editing this file.
 */

// ==============================================================================
// 1. CONFIGURATION SECTION
// ==============================================================================
const API_KEY = "YOUR_API_KEY"; // <-- REPLACE WITH YOUR OPENWEATHERMAP API KEY

// OpenWeatherMap API Endpoints
const OWM_BASE_URL = "https://api.openweathermap.org/data/2.5";

// Default fallback city on first launch
const DEFAULT_CITY = "London";

// ==============================================================================
// 2. APPLICATION STATE
// ==============================================================================
const state = {
  currentUnit: localStorage.getItem("weathernow_unit") || "C", // "C" or "F"
  lastCity: localStorage.getItem("weathernow_last_city") || DEFAULT_CITY,
  currentWeatherData: null,
  forecastData: null,
  isLoading: false,
};

// ==============================================================================
// 3. DOM ELEMENT REFERENCES
// ==============================================================================
const elements = {
  // Navigation & Controls
  mobileMenuBtn: document.getElementById("mobileMenuBtn"),
  navLinks: document.getElementById("navLinks"),
  unitCelsiusBtn: document.getElementById("unitCelsius"),
  unitFahrenheitBtn: document.getElementById("unitFahrenheit"),
  openApiKeyModalBtn: document.getElementById("openApiKeyModalBtn"),
  apiKeyStatusDot: document.getElementById("apiKeyStatusDot"),

  // Search & Inputs
  searchForm: document.getElementById("searchForm"),
  cityInput: document.getElementById("cityInput"),
  searchBtn: document.getElementById("searchBtn"),
  locationBtn: document.getElementById("locationBtn"),
  clearSearchBtn: document.getElementById("clearSearchBtn"),
  recentSearches: document.getElementById("recentSearches"),

  // Status & Feedback
  infoBanner: document.getElementById("infoBanner"),
  infoBannerText: document.getElementById("infoBannerText"),
  bannerConfigBtn: document.getElementById("bannerConfigBtn"),
  bannerCloseBtn: document.getElementById("bannerCloseBtn"),
  messageContainer: document.getElementById("messageContainer"),
  messageTitle: document.getElementById("messageTitle"),
  messageBody: document.getElementById("messageBody"),
  loadingWrapper: document.getElementById("loadingWrapper"),
  loadingText: document.getElementById("loadingText"),
  dashboardContent: document.getElementById("dashboardContent"),

  // Current Weather Card
  cityName: document.getElementById("cityName"),
  countryCode: document.getElementById("countryCode"),
  currentDate: document.getElementById("currentDate"),
  currentTime: document.getElementById("currentTime"),
  currentTemp: document.getElementById("currentTemp"),
  unitSymbol: document.getElementById("unitSymbol"),
  weatherCondition: document.getElementById("weatherCondition"),
  feelsLikeTemp: document.getElementById("feelsLikeTemp"),
  currentWeatherIcon: document.getElementById("currentWeatherIcon"),
  tempHigh: document.getElementById("tempHigh"),
  tempLow: document.getElementById("tempLow"),
  lastUpdatedTime: document.getElementById("lastUpdatedTime"),
  refreshWeatherBtn: document.getElementById("refreshWeatherBtn"),

  // Sun Cycle & Atmospheric Highlights
  sunriseTime: document.getElementById("sunriseTime"),
  sunsetTime: document.getElementById("sunsetTime"),
  windDirection: document.getElementById("windDirection"),
  visibilityDesc: document.getElementById("visibilityDesc"),

  // Detailed Metrics
  humidityValue: document.getElementById("humidityValue"),
  humidityDesc: document.getElementById("humidityDesc"),
  humidityBar: document.getElementById("humidityBar"),
  windSpeedValue: document.getElementById("windSpeedValue"),
  windGustDesc: document.getElementById("windGustDesc"),
  windBar: document.getElementById("windBar"),
  pressureValue: document.getElementById("pressureValue"),
  pressureDesc: document.getElementById("pressureDesc"),
  pressureBar: document.getElementById("pressureBar"),
  visibilityValue: document.getElementById("visibilityValue"),
  visibilityQual: document.getElementById("visibilityQual"),
  visibilityBar: document.getElementById("visibilityBar"),
  cloudinessValue: document.getElementById("cloudinessValue"),
  cloudinessDesc: document.getElementById("cloudinessDesc"),
  cloudinessBar: document.getElementById("cloudinessBar"),
  dewPointValue: document.getElementById("dewPointValue"),
  dewBar: document.getElementById("dewBar"),

  // 5-Day & Hourly Forecast
  forecastGrid: document.getElementById("forecastGrid"),
  hourlyList: document.getElementById("hourlyList"),

  // API Key Modal
  apiKeyModal: document.getElementById("apiKeyModal"),
  closeApiKeyModalBtn: document.getElementById("closeApiKeyModalBtn"),
  apiKeyInputField: document.getElementById("apiKeyInputField"),
  saveApiKeyBtn: document.getElementById("saveApiKeyBtn"),
  clearApiKeyBtn: document.getElementById("clearApiKeyBtn"),
};

// ==============================================================================
// 4. HELPER UTILITIES
// ==============================================================================

/**
 * Returns active OpenWeatherMap API Key, checking localStorage first then constant.
 */
function getActiveApiKey() {
  const customKey = localStorage.getItem("weathernow_api_key");
  if (customKey && customKey.trim().length > 0) {
    return customKey.trim();
  }
  if (API_KEY && API_KEY !== "YOUR_API_KEY" && API_KEY.trim().length > 0) {
    return API_KEY.trim();
  }
  return null;
}

function celsiusToFahrenheit(c) {
  return (c * 9) / 5 + 32;
}

function formatTemp(tempC, unit = state.currentUnit) {
  if (tempC === null || tempC === undefined || isNaN(tempC)) return "--";
  const num = Math.round(unit === "F" ? celsiusToFahrenheit(tempC) : tempC);
  return `${num}`;
}

function formatTempWithUnit(tempC, unit = state.currentUnit) {
  const val = formatTemp(tempC, unit);
  return val === "--" ? "--" : `${val}Â°${unit}`;
}

function formatWindSpeed(speedMps, unit = state.currentUnit) {
  if (speedMps === null || speedMps === undefined) return "--";
  if (unit === "F") {
    const mph = (speedMps * 2.23694).toFixed(1);
    return `${mph} mph`;
  }
  const kmh = (speedMps * 3.6).toFixed(1);
  return `${kmh} km/h`;
}

function getWindDirection(deg) {
  if (deg === undefined || deg === null) return "N/A";
  const cardinals = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(deg / 22.5) % 16;
  return `${cardinals[index]} (${Math.round(deg)}Â°)`;
}

function formatUnixTime(timestamp, timezoneOffsetSeconds = 0) {
  if (!timestamp) return "--:--";
  const date = new Date((timestamp + timezoneOffsetSeconds) * 1000);
  return date.toUTCString().slice(17, 22) + (date.getUTCHours() >= 12 ? " PM" : " AM");
}

function formatUnixDate(timestamp, timezoneOffsetSeconds = 0) {
  if (!timestamp) return "";
  const date = new Date((timestamp + timezoneOffsetSeconds) * 1000);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayName = days[date.getUTCDay()];
  const monthName = months[date.getUTCMonth()];
  const dayNum = date.getUTCDate();
  const year = date.getUTCFullYear();
  return `${dayName}, ${monthName} ${dayNum}, ${year}`;
}

function calculateDewPoint(tempC, humidity) {
  if (tempC === null || humidity === null) return 0;
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * tempC) / (b + tempC) + Math.log(humidity / 100);
  return (b * alpha) / (a - alpha);
}

// ==============================================================================
// 5. USER INTERFACE & FEEDBACK CONTROLS
// ==============================================================================

function showMessage(title, text, isError = true) {
  elements.messageTitle.textContent = title;
  elements.messageBody.textContent = text;
  elements.messageContainer.style.display = "block";

  const box = elements.messageContainer.querySelector(".message-box");
  if (isError) {
    box.style.background = "rgba(239, 68, 68, 0.15)";
    box.style.borderColor = "rgba(239, 68, 68, 0.35)";
    elements.messageContainer.querySelector(".message-icon").className = "fa-solid fa-triangle-exclamation message-icon";
  } else {
    box.style.background = "rgba(16, 185, 129, 0.15)";
    box.style.borderColor = "rgba(16, 185, 129, 0.35)";
    elements.messageContainer.querySelector(".message-icon").className = "fa-solid fa-circle-check message-icon";
  }

  elements.messageContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function clearMessage() {
  elements.messageContainer.style.display = "none";
}

function setLoading(isLoading, message = "Retrieving live weather telemetry...") {
  state.isLoading = isLoading;
  if (isLoading) {
    elements.loadingText.textContent = message;
    elements.loadingWrapper.classList.add("active");
    elements.dashboardContent.classList.add("loading");
    clearMessage();
  } else {
    elements.loadingWrapper.classList.remove("active");
    elements.dashboardContent.classList.remove("loading");
  }
}

function updateApiKeyStatusIndicator() {
  const activeKey = getActiveApiKey();
  if (activeKey) {
    elements.apiKeyStatusDot.classList.remove("warning");
    elements.apiKeyStatusDot.style.background = "#10b981";
    elements.infoBanner.classList.remove("show");
  } else {
    elements.apiKeyStatusDot.classList.add("warning");
    elements.apiKeyStatusDot.style.background = "#f59e0b";
    elements.infoBanner.classList.add("show");
  }
}

// ==============================================================================
// 6. DYNAMIC WEATHER THEMES
// ==============================================================================

function updateDynamicWeatherTheme(weatherCode, isDayTime = true) {
  let theme = "clear";

  if (weatherCode >= 200 && weatherCode < 300) {
    theme = "thunderstorm";
  } else if (weatherCode >= 300 && weatherCode < 600) {
    theme = "rain";
  } else if (weatherCode >= 600 && weatherCode < 700) {
    theme = "snow";
  } else if (weatherCode >= 700 && weatherCode < 800) {
    theme = "mist";
  } else if (weatherCode === 800) {
    theme = "clear";
  } else if (weatherCode > 800) {
    theme = "clouds";
  }

  document.body.setAttribute("data-weather-theme", theme);
  document.body.setAttribute("data-is-day", isDayTime ? "true" : "false");
}

// ==============================================================================
// 7. API COMMUNICATION
// ==============================================================================

async function fetchWeatherData(queryOrCoords) {
  setLoading(true);
  clearMessage();

  const apiKey = getActiveApiKey();

  try {
    let current, forecast;

    if (apiKey) {
      // Direct OpenWeatherMap API Flow
      let currentUrl, forecastUrl;

      if (typeof queryOrCoords === "string") {
        const encodedCity = encodeURIComponent(queryOrCoords.trim());
        currentUrl = `${OWM_BASE_URL}/weather?q=${encodedCity}&units=metric&appid=${apiKey}`;
        forecastUrl = `${OWM_BASE_URL}/forecast?q=${encodedCity}&units=metric&appid=${apiKey}`;
      } else {
        const { lat, lon } = queryOrCoords;
        currentUrl = `${OWM_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
        forecastUrl = `${OWM_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
      }

      const [resCurrent, resForecast] = await Promise.all([
        fetch(currentUrl),
        fetch(forecastUrl),
      ]);

      if (resCurrent.status === 401 || resForecast.status === 401) {
        throw new Error("API_KEY_INVALID");
      }

      if (resCurrent.status === 404 || resForecast.status === 404) {
        throw new Error("CITY_NOT_FOUND");
      }

      if (!resCurrent.ok || !resForecast.ok) {
        throw new Error("HTTP_ERROR_" + resCurrent.status);
      }

      current = await resCurrent.json();
      forecast = await resForecast.json();
    } else {
      // Seamless Real-Time Meteorological Fallback (zero keys required)
      let lat, lon, resolvedName, resolvedCountry;

      if (typeof queryOrCoords === "string") {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          queryOrCoords.trim()
        )}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
          throw new Error("CITY_NOT_FOUND");
        }

        const top = geoData.results[0];
        lat = top.latitude;
        lon = top.longitude;
        resolvedName = top.name;
        resolvedCountry = top.country_code || top.country || "WL";
      } else {
        lat = queryOrCoords.lat;
        lon = queryOrCoords.lon;
        try {
          const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
          const revRes = await fetch(revUrl);
          const revData = await revRes.json();
          resolvedName = revData.address.city || revData.address.town || revData.address.village || "Current Location";
          resolvedCountry = (revData.address.country_code || "GPS").toUpperCase();
        } catch {
          resolvedName = "Current Location";
          resolvedCountry = "GPS";
        }
      }

      const liveUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`;
      const liveRes = await fetch(liveUrl);
      if (!liveRes.ok) throw new Error("LIVE_FETCH_FAILED");
      const liveData = await liveRes.json();

      const normalized = normalizeLiveMeteoToOwm(liveData, resolvedName, resolvedCountry, lat, lon);
      current = normalized.current;
      forecast = normalized.forecast;
    }

    state.currentWeatherData = current;
    state.forecastData = forecast;
    state.lastCity = current.name;
    localStorage.setItem("weathernow_last_city", current.name);

    renderCurrentWeather(current);
    renderForecast(forecast);

  } catch (err) {
    handleWeatherError(err, queryOrCoords);
  } finally {
    setLoading(false);
  }
}

function normalizeLiveMeteoToOwm(liveData, cityName, countryCode, lat, lon) {
  const currentM = liveData.current;
  const dailyM = liveData.daily;
  const isDay = currentM.is_day === 1;

  const wmoMap = {
    0: { id: 800, main: "Clear", description: "Clear sky", icon: isDay ? "01d" : "01n" },
    1: { id: 801, main: "Mainly Clear", description: "Mainly clear", icon: isDay ? "02d" : "02n" },
    2: { id: 802, main: "Partly Cloudy", description: "Partly cloudy", icon: isDay ? "03d" : "03n" },
    3: { id: 804, main: "Overcast", description: "Overcast clouds", icon: "04d" },
    45: { id: 741, main: "Fog", description: "Foggy conditions", icon: "50d" },
    48: { id: 741, main: "Depositing Rime Fog", description: "Depositing rime fog", icon: "50d" },
    51: { id: 300, main: "Light Drizzle", description: "Light drizzle", icon: "09d" },
    53: { id: 301, main: "Moderate Drizzle", description: "Moderate drizzle", icon: "09d" },
    55: { id: 302, main: "Dense Drizzle", description: "Dense drizzle", icon: "09d" },
    61: { id: 500, main: "Slight Rain", description: "Slight rain showers", icon: "10d" },
    63: { id: 501, main: "Moderate Rain", description: "Moderate rain", icon: "10d" },
    65: { id: 502, main: "Heavy Rain", description: "Heavy rain", icon: "10d" },
    71: { id: 600, main: "Slight Snow", description: "Slight snow fall", icon: "13d" },
    73: { id: 601, main: "Moderate Snow", description: "Moderate snow fall", icon: "13d" },
    75: { id: 602, main: "Heavy Snow", description: "Heavy snow fall", icon: "13d" },
    80: { id: 520, main: "Rain Showers", description: "Slight rain showers", icon: "09d" },
    95: { id: 200, main: "Thunderstorm", description: "Thunderstorm", icon: "11d" },
  };

  const weatherInfo = wmoMap[currentM.weather_code] || {
    id: 800,
    main: "Clear",
    description: "Clear atmosphere",
    icon: isDay ? "01d" : "01n",
  };

  const nowEpoch = Math.floor(Date.now() / 1000);
  const sunriseEpoch = dailyM.sunrise && dailyM.sunrise[0] ? Math.floor(new Date(dailyM.sunrise[0]).getTime() / 1000) : nowEpoch - 14400;
  const sunsetEpoch = dailyM.sunset && dailyM.sunset[0] ? Math.floor(new Date(dailyM.sunset[0]).getTime() / 1000) : nowEpoch + 14400;

  const current = {
    coord: { lon, lat },
    weather: [weatherInfo],
    main: {
      temp: currentM.temperature_2m,
      feels_like: currentM.apparent_temperature,
      temp_min: dailyM.temperature_2m_min[0] || currentM.temperature_2m - 3,
      temp_max: dailyM.temperature_2m_max[0] || currentM.temperature_2m + 4,
      pressure: Math.round(currentM.pressure_msl || currentM.surface_pressure || 1013),
      humidity: currentM.relative_humidity_2m,
    },
    visibility: 10000,
    wind: {
      speed: (currentM.wind_speed_10m / 3.6),
      deg: currentM.wind_direction_10m || 0,
    },
    clouds: { all: currentM.cloud_cover || 20 },
    dt: nowEpoch,
    sys: {
      country: countryCode,
      sunrise: sunriseEpoch,
      sunset: sunsetEpoch,
    },
    timezone: 0,
    name: cityName,
  };

  const forecastList = [];
  const daysCount = Math.min(5, dailyM.time.length);
  for (let i = 0; i < daysCount; i++) {
    const dayDate = dailyM.time[i];
    const wCode = dailyM.weather_code[i];
    const dayWeather = wmoMap[wCode] || { id: 800, main: "Clear", description: "Clear", icon: "01d" };
    const dateObj = new Date(dayDate + "T12:00:00Z");

    forecastList.push({
      dt: Math.floor(dateObj.getTime() / 1000),
      dt_txt: `${dayDate} 12:00:00`,
      main: {
        temp: ((dailyM.temperature_2m_max[i] + dailyM.temperature_2m_min[i]) / 2),
        temp_min: dailyM.temperature_2m_min[i],
        temp_max: dailyM.temperature_2m_max[i],
        humidity: currentM.relative_humidity_2m,
        pressure: Math.round(currentM.pressure_msl || 1013),
      },
      weather: [dayWeather],
      clouds: { all: 30 },
      wind: { speed: 3.5, deg: 180 },
    });
  }

  if (liveData.hourly && liveData.hourly.time) {
    const hourlyTimes = liveData.hourly.time.slice(0, 8);
    for (let j = 0; j < hourlyTimes.length; j++) {
      const hTime = hourlyTimes[j];
      const hTemp = liveData.hourly.temperature_2m[j];
      const hCode = liveData.hourly.weather_code[j];
      const hW = wmoMap[hCode] || { id: 800, main: "Clear", icon: "01d" };
      forecastList.push({
        dt: Math.floor(new Date(hTime).getTime() / 1000),
        dt_txt: hTime.replace("T", " ") + ":00",
        main: { temp: hTemp, temp_min: hTemp, temp_max: hTemp },
        weather: [hW],
        isHourly: true,
      });
    }
  }

  const forecast = {
    list: forecastList,
    city: { name: cityName, country: countryCode },
  };

  return { current, forecast };
}

function handleWe
