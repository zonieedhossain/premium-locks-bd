package config

import (
	"log/slog"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port             string
	JWTSecret        string
	AccessTokenTTL   time.Duration
	RefreshTokenTTL  time.Duration
	UploadDir        string
	StorageDir       string
	StorefrontURL    string
	AdminURL         string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		slog.Warn("no .env file found, using environment variables")
	}

	accessTTL, err := time.ParseDuration(getEnv("ACCESS_TOKEN_TTL", "15m"))
	if err != nil {
		accessTTL = 15 * time.Minute
	}
	refreshTTL, err := time.ParseDuration(getEnv("REFRESH_TOKEN_TTL", "168h"))
	if err != nil {
		refreshTTL = 7 * 24 * time.Hour
	}

	return &Config{
		Port:            getEnv("PORT", "8080"),
		JWTSecret:       getEnv("JWT_SECRET", "change-me-in-production"),
		AccessTokenTTL:  accessTTL,
		RefreshTokenTTL: refreshTTL,
		UploadDir:       getEnv("UPLOAD_DIR", "./uploads"),
		StorageDir:      getEnv("STORAGE_DIR", "./storage"),
		StorefrontURL:   getEnv("STOREFRONT_URL", "http://localhost:3000"),
		AdminURL:        getEnv("ADMIN_URL", "http://localhost:3001"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
