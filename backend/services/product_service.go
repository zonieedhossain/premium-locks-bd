package services

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"premium-locks-bd/models"
	"premium-locks-bd/repository"
)

// ProductService handles product business logic.
type ProductService struct {
	repo      repository.ProductRepository
	uploadDir string
}

// NewProductService creates a new ProductService.
func NewProductService(repo repository.ProductRepository, uploadDir string) *ProductService {
	return &ProductService{repo: repo, uploadDir: uploadDir}
}

// GetAllPublic returns only active products.
func (s *ProductService) GetAllPublic() ([]models.Product, error) {
	all, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}
	result := make([]models.Product, 0)
	for _, p := range all {
		if p.IsActive {
			result = append(result, p)
		}
	}
	return result, nil
}

// GetAll returns all products (admin).
func (s *ProductService) GetAll() ([]models.Product, error) {
	products, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}
	if products == nil {
		return []models.Product{}, nil
	}
	return products, nil
}

// GetBySlug returns an active product by slug.
func (s *ProductService) GetBySlug(slug string) (*models.Product, error) {
	p, err := s.repo.GetBySlug(slug)
	if err != nil {
		return nil, err
	}
	if !p.IsActive {
		return nil, fmt.Errorf("product not found: %s", slug)
	}
	return p, nil
}

// GetByCategory returns active products in a category.
func (s *ProductService) GetByCategory(category string) ([]models.Product, error) {
	return s.repo.GetByCategory(category)
}

// GetByID returns any product by ID (admin).
func (s *ProductService) GetByID(id string) (*models.Product, error) {
	return s.repo.GetByID(id)
}

// ProductInput carries fields for create/update.
type ProductInput struct {
	Name             string
	Category         string
	Price            float64
	DiscountPrice    float64
	ShortDescription string
	Description      string
	StockQuantity    int
	CostPrice        float64
	IsActive         bool
	MainImage        string
	GalleryImages    []string
}

// Create validates input and persists a new product.
func (s *ProductService) Create(input ProductInput) (*models.Product, error) {
	if err := validateProductInput(input); err != nil {
		return nil, err
	}

	slug := s.uniqueSlug(input.Name)
	sku := "PLB-" + strings.ToUpper(uuid.NewString()[:8])
	now := time.Now().UTC().Format(time.RFC3339)

	if input.GalleryImages == nil {
		input.GalleryImages = []string{}
	}

	p := models.Product{
		ID:               uuid.NewString(),
		Name:             input.Name,
		Slug:             slug,
		SKU:              sku,
		Category:         input.Category,
		Price:            input.Price,
		DiscountPrice:    input.DiscountPrice,
		ShortDescription: input.ShortDescription,
		Description:      input.Description,
		StockQuantity:    input.StockQuantity,
		CostPrice:        input.CostPrice,
		MainImage:        input.MainImage,
		GalleryImages:    input.GalleryImages,
		IsActive:         input.IsActive,
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	if err := s.repo.Save(p); err != nil {
		return nil, fmt.Errorf("save product: %w", err)
	}
	return &p, nil
}

// Update modifies an existing product.
func (s *ProductService) Update(id string, input ProductInput) (*models.Product, error) {
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if err := validateProductInput(input); err != nil {
		return nil, err
	}

	mainImage := input.MainImage
	if mainImage == "" {
		mainImage = existing.MainImage
	}
	gallery := input.GalleryImages
	if gallery == nil {
		gallery = existing.GalleryImages
	}

	p := models.Product{
		ID:               id,
		Name:             input.Name,
		Slug:             existing.Slug,
		SKU:              existing.SKU,
		Category:         input.Category,
		Price:            input.Price,
		DiscountPrice:    input.DiscountPrice,
		ShortDescription: input.ShortDescription,
		Description:      input.Description,
		StockQuantity:    input.StockQuantity,
		CostPrice:        input.CostPrice,
		MainImage:        mainImage,
		GalleryImages:    gallery,
		IsActive:         input.IsActive,
		CreatedAt:        existing.CreatedAt,
		UpdatedAt:        time.Now().UTC().Format(time.RFC3339),
	}

	if err := s.repo.Update(p); err != nil {
		return nil, err
	}
	return &p, nil
}

// Delete removes a product and its main image.
func (s *ProductService) Delete(id string) error {
	p, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if err := s.repo.Delete(id); err != nil {
		return err
	}
	// Best-effort image cleanup
	if p.MainImage != "" {
		filename := filepath.Base(p.MainImage)
		_ = os.Remove(filepath.Join(s.uploadDir, filename))
	}
	return nil
}

func (s *ProductService) uniqueSlug(name string) string {
	base := slugify(name)
	slug := base
	for i := 2; ; i++ {
		if _, err := s.repo.GetBySlug(slug); err != nil {
			break // slug is free
		}
		slug = fmt.Sprintf("%s-%d", base, i)
	}
	return slug
}

var nonAlphanumRE = regexp.MustCompile(`[^a-z0-9\s-]`)
var spaceRE = regexp.MustCompile(`\s+`)

func slugify(s string) string {
	s = strings.ToLower(s)
	s = nonAlphanumRE.ReplaceAllString(s, "")
	s = spaceRE.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}

func validateProductInput(input ProductInput) error {
	if strings.TrimSpace(input.Name) == "" {
		return fmt.Errorf("name is required")
	}
	if strings.TrimSpace(input.Category) == "" {
		return fmt.Errorf("category is required")
	}
	if input.Price <= 0 {
		return fmt.Errorf("price must be greater than 0")
	}
	if input.StockQuantity < 0 {
		return fmt.Errorf("stock quantity cannot be negative")
	}
	return nil
}
