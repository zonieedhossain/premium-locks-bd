package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"premium-locks-bd/models"
	"premium-locks-bd/services"
)

const uploadsDir = "./uploads"

// ProductHandler handles HTTP requests for products.
type ProductHandler struct {
	svc *services.ProductService
}

// NewProductHandler creates a ProductHandler.
func NewProductHandler(svc *services.ProductService) *ProductHandler {
	return &ProductHandler{svc: svc}
}

// GetAll godoc — GET /api/products
func (h *ProductHandler) GetAll(c *gin.Context) {
	products, err := h.svc.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, products)
}

// GetByID godoc — GET /api/products/:id
func (h *ProductHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	p, err := h.svc.GetByID(id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, p)
}

// Create godoc — POST /api/products (multipart/form-data)
func (h *ProductHandler) Create(c *gin.Context) {
	var input models.ProductInput
	if err := c.ShouldBind(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	imageURL, err := h.handleImageUpload(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("image upload: %s", err.Error())})
		return
	}

	p, err := h.svc.Create(input, imageURL)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, p)
}

// Update godoc — PUT /api/products/:id (multipart/form-data)
func (h *ProductHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var input models.ProductInput
	if err := c.ShouldBind(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	imageURL, err := h.handleImageUpload(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("image upload: %s", err.Error())})
		return
	}

	p, err := h.svc.Update(id, input, imageURL)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, p)
}

// Delete godoc — DELETE /api/products/:id
func (h *ProductHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.Delete(id); err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "product deleted"})
}

// handleImageUpload saves an uploaded image file and returns its URL path.
// Returns an empty string (no error) when no file is provided.
func (h *ProductHandler) handleImageUpload(c *gin.Context) (string, error) {
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		// No file provided — that's acceptable for updates
		return "", nil
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true}
	if !allowed[ext] {
		return "", fmt.Errorf("unsupported image type: %s", ext)
	}

	if err := os.MkdirAll(uploadsDir, 0o755); err != nil {
		return "", fmt.Errorf("create uploads dir: %w", err)
	}

	filename := uuid.NewString() + ext
	destPath := filepath.Join(uploadsDir, filename)

	dst, err := os.Create(destPath)
	if err != nil {
		return "", fmt.Errorf("create file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("write file: %w", err)
	}

	return "/uploads/" + filename, nil
}
