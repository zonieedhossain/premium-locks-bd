package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"premium-locks-bd/middleware"
	"premium-locks-bd/services"
)

// UserHandler handles user management routes.
type UserHandler struct {
	userSvc *services.UserService
}

// NewUserHandler creates a UserHandler.
func NewUserHandler(userSvc *services.UserService) *UserHandler {
	return &UserHandler{userSvc: userSvc}
}

// GetAll — GET /api/admin/users
func (h *UserHandler) GetAll(c *gin.Context) {
	users, err := h.userSvc.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}

// GetByID — GET /api/admin/users/:id
func (h *UserHandler) GetByID(c *gin.Context) {
	u, err := h.userSvc.GetByID(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, u)
}

// Create — POST /api/admin/users
func (h *UserHandler) Create(c *gin.Context) {
	var body struct {
		Name        string   `json:"name"        binding:"required"`
		Email       string   `json:"email"       binding:"required,email"`
		Password    string   `json:"password"    binding:"required,min=6"`
		Role        string   `json:"role"        binding:"required"`
		Permissions []string `json:"permissions"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	claims := getClaims(c)
	input := services.UserInput{
		Name:        body.Name,
		Email:       body.Email,
		Password:    body.Password,
		Role:        body.Role,
		Permissions: body.Permissions,
	}

	u, err := h.userSvc.Create(input, claims.UserID, claims.Role)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, u)
}

// Update — PUT /api/admin/users/:id
func (h *UserHandler) Update(c *gin.Context) {
	var body struct {
		Name        string   `json:"name"`
		Email       string   `json:"email"`
		Password    string   `json:"password"`
		Role        string   `json:"role"`
		Permissions []string `json:"permissions"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	claims := getClaims(c)
	input := services.UserInput{
		Name:        body.Name,
		Email:       body.Email,
		Password:    body.Password,
		Role:        body.Role,
		Permissions: body.Permissions,
	}

	u, err := h.userSvc.Update(c.Param("id"), input, claims.Role)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, u)
}

// ToggleActive — PATCH /api/admin/users/:id/toggle
func (h *UserHandler) ToggleActive(c *gin.Context) {
	u, err := h.userSvc.ToggleActive(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, u)
}

// Delete — DELETE /api/admin/users/:id
func (h *UserHandler) Delete(c *gin.Context) {
	if err := h.userSvc.Delete(c.Param("id")); err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "user deleted"})
}

func getClaims(c *gin.Context) *services.Claims {
	raw, _ := c.Get(middleware.ClaimsKey)
	claims, _ := raw.(*services.Claims)
	return claims
}
