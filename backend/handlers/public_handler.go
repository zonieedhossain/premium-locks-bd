package handlers

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"premium-locks-bd/models"
	"premium-locks-bd/services"
)

// PublicHandler serves unauthenticated product routes for the storefront.
type PublicHandler struct {
	productSvc *services.ProductService
	emailSvc   *services.EmailService
}

// NewPublicHandler creates a PublicHandler.
func NewPublicHandler(productSvc *services.ProductService, emailSvc *services.EmailService) *PublicHandler {
	return &PublicHandler{productSvc: productSvc, emailSvc: emailSvc}
}

// GetProducts — GET /api/public/products
func (h *PublicHandler) GetProducts(c *gin.Context) {
	products, err := h.productSvc.GetAllPublic()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, products)
}

// GetProductBySlug — GET /api/public/products/:slug
func (h *PublicHandler) GetProductBySlug(c *gin.Context) {
	p, err := h.productSvc.GetBySlug(c.Param("slug"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, p)
}

// GetProductsByCategory — GET /api/public/products/category/:category
func (h *PublicHandler) GetProductsByCategory(c *gin.Context) {
	products, err := h.productSvc.GetByCategory(c.Param("category"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if products == nil {
		products = []models.Product{}
	}
	c.JSON(http.StatusOK, products)
}

// Contact — POST /api/public/contact
func (h *PublicHandler) Contact(c *gin.Context) {
	var body struct {
		Name    string `json:"name"    binding:"required"`
		Email   string `json:"email"   binding:"required,email"`
		Phone   string `json:"phone"`
		Subject string `json:"subject"`
		Message string `json:"message" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	msg := services.ContactMessage{
		Name:    body.Name,
		Email:   body.Email,
		Phone:   body.Phone,
		Subject: body.Subject,
		Message: body.Message,
		Time:    time.Now().UTC().Format(time.RFC1123),
	}

	if err := h.emailSvc.SendContactEmail(msg); err != nil {
		slog.Error("contact email failed", "err", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Message received. We'll get back to you soon!"})
}
