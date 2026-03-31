package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"premium-locks-bd/models"
	"premium-locks-bd/services"
)

// PublicHandler serves unauthenticated product routes for the storefront.
type PublicHandler struct {
	productSvc *services.ProductService
}

// NewPublicHandler creates a PublicHandler.
func NewPublicHandler(productSvc *services.ProductService) *PublicHandler {
	return &PublicHandler{productSvc: productSvc}
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
