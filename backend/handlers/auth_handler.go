package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"premium-locks-bd/middleware"
	"premium-locks-bd/services"
)

// AuthHandler handles auth-related HTTP requests.
type AuthHandler struct {
	authSvc *services.AuthService
	userSvc *services.UserService
}

// NewAuthHandler creates an AuthHandler.
func NewAuthHandler(authSvc *services.AuthService, userSvc *services.UserService) *AuthHandler {
	return &AuthHandler{authSvc: authSvc, userSvc: userSvc}
}

// Login — POST /api/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var body struct {
		Email    string `json:"email"    binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	access, refresh, user, err := h.authSvc.Login(body.Email, body.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token":  access,
		"refresh_token": refresh,
		"user":          user.Safe(),
	})
}

// Refresh — POST /api/auth/refresh
func (h *AuthHandler) Refresh(c *gin.Context) {
	var body struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	access, err := h.authSvc.Refresh(body.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"access_token": access})
}

// Logout — POST /api/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	_ = c.ShouldBindJSON(&body)
	_ = h.authSvc.Logout(body.RefreshToken)
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

// Me — GET /api/auth/me
func (h *AuthHandler) Me(c *gin.Context) {
	raw, _ := c.Get(middleware.ClaimsKey)
	claims, _ := raw.(*services.Claims)

	user, err := h.userSvc.GetByID(claims.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}
