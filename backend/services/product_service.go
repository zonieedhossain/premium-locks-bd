package services

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"premium-locks-bd/models"
	"premium-locks-bd/storage"
)

// ProductService contains business logic for product operations.
type ProductService struct {
	store *storage.ExcelStore
}

// NewProductService creates a ProductService with the given store.
func NewProductService(store *storage.ExcelStore) *ProductService {
	return &ProductService{store: store}
}

// GetAll returns all products.
func (s *ProductService) GetAll() ([]models.Product, error) {
	products, err := s.store.GetAll()
	if err != nil {
		return nil, fmt.Errorf("get all products: %w", err)
	}
	if products == nil {
		products = []models.Product{}
	}
	return products, nil
}

// GetByID returns a single product or an error if not found.
func (s *ProductService) GetByID(id string) (*models.Product, error) {
	if id == "" {
		return nil, fmt.Errorf("id is required")
	}
	return s.store.GetByID(id)
}

// Create validates input, assigns an ID and timestamps, and persists the product.
func (s *ProductService) Create(input models.ProductInput, imageURL string) (*models.Product, error) {
	if err := validateInput(input); err != nil {
		return nil, err
	}

	now := time.Now().UTC().Format(time.RFC3339)
	p := models.Product{
		ID:          uuid.NewString(),
		Name:        input.Name,
		Description: input.Description,
		Price:       input.Price,
		Category:    input.Category,
		Stock:       input.Stock,
		ImageURL:    imageURL,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := s.store.Save(p); err != nil {
		return nil, fmt.Errorf("save product: %w", err)
	}
	return &p, nil
}

// Update validates input and overwrites the existing product.
func (s *ProductService) Update(id string, input models.ProductInput, imageURL string) (*models.Product, error) {
	if id == "" {
		return nil, fmt.Errorf("id is required")
	}
	if err := validateInput(input); err != nil {
		return nil, err
	}

	existing, err := s.store.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Keep existing image if no new one is provided
	if imageURL == "" {
		imageURL = existing.ImageURL
	}

	p := models.Product{
		ID:          id,
		Name:        input.Name,
		Description: input.Description,
		Price:       input.Price,
		Category:    input.Category,
		Stock:       input.Stock,
		ImageURL:    imageURL,
		CreatedAt:   existing.CreatedAt,
		UpdatedAt:   time.Now().UTC().Format(time.RFC3339),
	}

	if err := s.store.Update(p); err != nil {
		return nil, fmt.Errorf("update product: %w", err)
	}
	return &p, nil
}

// Delete removes a product by ID.
func (s *ProductService) Delete(id string) error {
	if id == "" {
		return fmt.Errorf("id is required")
	}
	return s.store.Delete(id)
}

func validateInput(input models.ProductInput) error {
	if input.Name == "" {
		return fmt.Errorf("name is required")
	}
	if input.Price <= 0 {
		return fmt.Errorf("price must be greater than 0")
	}
	if input.Category == "" {
		return fmt.Errorf("category is required")
	}
	if input.Stock < 0 {
		return fmt.Errorf("stock cannot be negative")
	}
	return nil
}
