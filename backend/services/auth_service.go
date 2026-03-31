package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"premium-locks-bd/models"
	"premium-locks-bd/repository"
)

// Claims embeds standard JWT claims with user-specific fields.
type Claims struct {
	UserID      string   `json:"user_id"`
	Email       string   `json:"email"`
	Role        string   `json:"role"`
	Permissions []string `json:"permissions"`
	jwt.RegisteredClaims
}

// AuthService handles authentication logic.
type AuthService struct {
	userRepo        repository.UserRepository
	jwtSecret       []byte
	accessTokenTTL  time.Duration
	refreshTokenTTL time.Duration
}

// NewAuthService creates a new AuthService.
func NewAuthService(
	userRepo repository.UserRepository,
	jwtSecret string,
	accessTTL, refreshTTL time.Duration,
) *AuthService {
	return &AuthService{
		userRepo:        userRepo,
		jwtSecret:       []byte(jwtSecret),
		accessTokenTTL:  accessTTL,
		refreshTokenTTL: refreshTTL,
	}
}

// Login validates credentials and returns access + refresh tokens.
func (s *AuthService) Login(email, password string) (accessToken, refreshToken string, user *models.User, err error) {
	u, err := s.userRepo.GetByEmail(email)
	if err != nil {
		return "", "", nil, errors.New("invalid credentials")
	}
	if !u.IsActive {
		return "", "", nil, errors.New("account is deactivated")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return "", "", nil, errors.New("invalid credentials")
	}

	access, err := s.generateToken(u, s.accessTokenTTL)
	if err != nil {
		return "", "", nil, fmt.Errorf("generate access token: %w", err)
	}
	refresh, err := s.generateToken(u, s.refreshTokenTTL)
	if err != nil {
		return "", "", nil, fmt.Errorf("generate refresh token: %w", err)
	}

	// Store hashed refresh token
	hash, _ := bcrypt.GenerateFromPassword([]byte(refresh), bcrypt.DefaultCost)
	u.RefreshToken = string(hash)
	if err := s.userRepo.Update(*u); err != nil {
		return "", "", nil, fmt.Errorf("store refresh token: %w", err)
	}

	return access, refresh, u, nil
}

// Refresh validates a refresh token and returns a new access token.
func (s *AuthService) Refresh(refreshToken string) (string, error) {
	claims, err := s.parseToken(refreshToken)
	if err != nil {
		return "", errors.New("invalid or expired refresh token")
	}

	u, err := s.userRepo.GetByID(claims.UserID)
	if err != nil {
		return "", errors.New("user not found")
	}
	if u.RefreshToken == "" {
		return "", errors.New("no active session")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.RefreshToken), []byte(refreshToken)); err != nil {
		return "", errors.New("invalid refresh token")
	}

	return s.generateToken(u, s.accessTokenTTL)
}

// Logout clears the stored refresh token.
func (s *AuthService) Logout(refreshToken string) error {
	claims, err := s.parseToken(refreshToken)
	if err != nil {
		return nil // already invalid — treat as success
	}
	u, err := s.userRepo.GetByID(claims.UserID)
	if err != nil {
		return nil
	}
	u.RefreshToken = ""
	return s.userRepo.Update(*u)
}

// ParseAccessToken parses and validates an access token.
func (s *AuthService) ParseAccessToken(tokenStr string) (*Claims, error) {
	return s.parseToken(tokenStr)
}

func (s *AuthService) generateToken(u *models.User, ttl time.Duration) (string, error) {
	claims := Claims{
		UserID:      u.ID,
		Email:       u.Email,
		Role:        u.Role,
		Permissions: u.Permissions,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        uuid.NewString(),
			Subject:   u.ID,
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(ttl)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

func (s *AuthService) parseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return s.jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
