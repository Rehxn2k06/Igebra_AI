"use client";

interface WeatherResult {
  location?: string;
  temperature?: number;
  feelsLike?: number;
  humidity?: number;
  windSpeed?: number;
  condition?: string;
  unit?: string;
  error?: string;
}

export default function WeatherCard({ result }: { result: WeatherResult }) {
  if (result.error) {
    return (
      <div className="tool-card fade-in">
        <div className="tool-card-header">🌤️ Weather</div>
        <div className="tool-card-body">
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>{result.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tool-card fade-in" role="region" aria-label={`Weather for ${result.location}`}>
      <div className="tool-card-header">🌤️ Current Weather</div>
      <div className="tool-card-body">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
              📍 {result.location}
            </div>
            <div className="weather-temp">
              {result.temperature}{result.unit}
            </div>
            <div className="weather-condition">{result.condition}</div>
          </div>
          <div style={{ fontSize: 56 }}>{result.condition?.split(" ").pop()}</div>
        </div>

        <div className="weather-stats">
          <div className="weather-stat">
            <span className="weather-stat-label">Feels like</span>
            <span className="weather-stat-value">{result.feelsLike}{result.unit}</span>
          </div>
          <div className="weather-stat">
            <span className="weather-stat-label">Humidity</span>
            <span className="weather-stat-value">{result.humidity}%</span>
          </div>
          <div className="weather-stat">
            <span className="weather-stat-label">Wind</span>
            <span className="weather-stat-value">{result.windSpeed} km/h</span>
          </div>
        </div>
      </div>
    </div>
  );
}
