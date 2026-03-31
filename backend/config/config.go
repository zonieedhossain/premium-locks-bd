package config

import (
	"log/slog"
	"os"
	"strconv"
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
	// SMTP
	SMTPHost     string
	SMTPPort     string
	SMTPUser     string
	SMTPPass     string
	SMTPFrom     string
	ContactEmail string
	// Invoice / company
	TaxPercentage  float64
	InvoiceDir     string
	CompanyName    string
	CompanyAddress string
	CompanyPhone   string
	CompanyEmail   string
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

	taxPct, _ := strconv.ParseFloat(getEnv("TAX_PERCENTAGE", "0"), 64)

	return &Config{
		Port:            getEnv("PORT", "8080"),
		JWTSecret:       getEnv("JWT_SECRET", "change-me-in-production"),
		AccessTokenTTL:  accessTTL,
		RefreshTokenTTL: refreshTTL,
		UploadDir:       getEnv("UPLOAD_DIR", "./uploads"),
		StorageDir:      getEnv("STORAGE_DIR", "./storage"),
		StorefrontURL:   getEnv("STOREFRONT_URL", "http://localhost:3000"),
		AdminURL:        getEnv("ADMIN_URL", "http://localhost:3001"),
		SMTPHost:        getEnv("SMTP_HOST", ""),
		SMTPPort:        getEnv("SMTP_PORT", "587"),
		SMTPUser:        getEnv("SMTP_USER", ""),
		SMTPPass:        getEnv("SMTP_PASS", ""),
		SMTPFrom:        getEnv("SMTP_FROM", ""),
		ContactEmail:    getEnv("CONTACT_RECEIVER_EMAIL", ""),
		TaxPercentage:   taxPct,
		InvoiceDir:      getEnv("INVOICE_DIR", "./invoices"),
		CompanyName:     getEnv("COMPANY_NAME", "Premium Locks BD"),
		CompanyAddress:  getEnv("COMPANY_ADDRESS", "Rajshahi, Bangladesh"),
		CompanyPhone:    getEnv("COMPANY_PHONE", "+880 1737-195614"),
		CompanyEmail:    getEnv("COMPANY_EMAIL", "premiumlocksbd@gmail.com"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
