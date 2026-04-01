package handlers

import (
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"premium-locks-bd/models"
	"premium-locks-bd/services"
	"premium-locks-bd/utils"
)

const maxUploadBytes = 5 << 20 // 5 MB

// AdminProductHandler handles authenticated product management routes.
type AdminProductHandler struct {
	productSvc *services.ProductService
	uploadDir  string
}

// NewAdminProductHandler creates an AdminProductHandler.
func NewAdminProductHandler(productSvc *services.ProductService, uploadDir string) *AdminProductHandler {
	return &AdminProductHandler{productSvc: productSvc, uploadDir: uploadDir}
}

// GetAll — GET /api/admin/products
func (h *AdminProductHandler) GetAll(c *gin.Context) {
	products, err := h.productSvc.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	page, limit := utils.ParsePagination(c)
	data, total := utils.Paginate(products, page, limit)
	c.JSON(http.StatusOK, models.PaginatedResponse[models.Product]{
		Data: data, Total: total, Page: page, Limit: limit,
	})
}

// GetByID — GET /api/admin/products/:id
func (h *AdminProductHandler) GetByID(c *gin.Context) {
	p, err := h.productSvc.GetByID(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, p)
}

// Create — POST /api/admin/products (multipart/form-data)
func (h *AdminProductHandler) Create(c *gin.Context) {
	input, err := h.parseProductForm(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mainImage, err := h.saveUpload(c, "main_image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "main_image: " + err.Error()})
		return
	}
	input.MainImage = mainImage

	p, err := h.productSvc.Create(input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, p)
}

// Update — PUT /api/admin/products/:id (multipart/form-data)
func (h *AdminProductHandler) Update(c *gin.Context) {
	id := c.Param("id")
	input, err := h.parseProductForm(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mainImage, err := h.saveUpload(c, "main_image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "main_image: " + err.Error()})
		return
	}
	input.MainImage = mainImage

	p, err := h.productSvc.Update(id, input)
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

// Delete — DELETE /api/admin/products/:id
func (h *AdminProductHandler) Delete(c *gin.Context) {
	if err := h.productSvc.Delete(c.Param("id")); err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "product deleted"})
}

// parseProductForm reads multipart form fields into a ProductInput.
func (h *AdminProductHandler) parseProductForm(c *gin.Context) (services.ProductInput, error) {
	var input services.ProductInput

	input.Name = c.PostForm("name")
	input.Category = c.PostForm("category")
	input.ShortDescription = c.PostForm("short_description")
	input.Description = c.PostForm("description")

	price, err := strconv.ParseFloat(c.PostForm("price"), 64)
	if err != nil || price <= 0 {
		return input, fmt.Errorf("price must be a positive number")
	}
	input.Price = price

	if dp := c.PostForm("discount_price"); dp != "" {
		input.DiscountPrice, _ = strconv.ParseFloat(dp, 64)
	}

	stock, _ := strconv.Atoi(c.PostForm("stock_quantity"))
	input.StockQuantity = stock

	if cp := c.PostForm("cost_price"); cp != "" {
		input.CostPrice, _ = strconv.ParseFloat(cp, 64)
	}

	input.IsActive = c.PostForm("is_active") == "true" || c.PostForm("is_active") == "1"

	return input, nil
}

// saveUpload saves an uploaded file and returns its URL path. Returns "" if no file.
func (h *AdminProductHandler) saveUpload(c *gin.Context, fieldName string) (string, error) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxUploadBytes)

	file, header, err := c.Request.FormFile(fieldName)
	if err != nil {
		return "", nil // no file provided
	}
	defer file.Close()

	// Validate MIME type
	ext := strings.ToLower(filepath.Ext(header.Filename))
	mimeType := mime.TypeByExtension(ext)
	if !strings.HasPrefix(mimeType, "image/") {
		// Fallback: sniff content
		buf := make([]byte, 512)
		n, _ := file.Read(buf)
		detected := http.DetectContentType(buf[:n])
		if !strings.HasPrefix(detected, "image/") {
			return "", fmt.Errorf("only image files are allowed")
		}
		// reset is not possible on multipart file, just trust extension if sniff fails
	}

	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true}
	if !allowed[ext] {
		return "", fmt.Errorf("unsupported image type: %s", ext)
	}

	if err := os.MkdirAll(h.uploadDir, 0o755); err != nil {
		return "", fmt.Errorf("create upload dir: %w", err)
	}

	filename := uuid.NewString() + ext
	dst, err := os.Create(filepath.Join(h.uploadDir, filename))
	if err != nil {
		return "", fmt.Errorf("create file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("write file: %w", err)
	}

	return "/uploads/" + filename, nil
}
