"use client";
import { useEffect, useState } from "react";

interface WeatherData {
  temp: number;
  feelsLike: number;
  condition: string;
  wind: string;
  humidity: number;
  rain: number;
  pm10: number;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Daejeon,KR&appid=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&units=metric&lang=kr`
        );
        const data = await res.json();
        if (data?.main) {
          setWeather({
            temp: data.main.temp,
            feelsLike: data.main.feels_like,
            condition: data.weather[0].description,
            wind: `${data.wind.speed} m/s`,
            humidity: data.main.humidity,
            rain: data.rain ? data.rain["1h"] : 0,
            pm10: 10, // 예시 (실제 미세먼지 API 연결 가능)
          });
        } else {
          setError("날씨 정보를 불러올 수 없습니다.");
        }
      } catch (err) {
        setError("날씨 정보를 가져오는 중 오류가 발생했습니다.");
      }
    };
    fetchWeather();
  }, []);

  if (error) return <div className="text-sm text-gray-600">{error}</div>;
  if (!weather) return <div className="text-sm text-gray-600">날씨 정보를 불러오는 중...</div>;

  return (
    <div className="flex items-center space-x-3 text-sm bg-gray-100 px-3 py-2 rounded-lg">
      <span>🌤 {weather.condition}</span>
      <span>{weather.temp}°C (체감 {weather.feelsLike}°C)</span>
      <span>💨 {weather.wind}</span>
      <span>💧습도 {weather.humidity}%</span>
      <span>☂ {weather.rain}%</span>
      <span>미세먼지 {weather.pm10}㎍/㎥</span>
    </div>
  );
}