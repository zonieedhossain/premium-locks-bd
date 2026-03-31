package repository

import (
	"fmt"

	"premium-locks-bd/models"
	"premium-locks-bd/storage"
)

// ProductRepository defines storage operations for products.
type ProductRepository interface {
	GetAll() ([]models.Product, error)
	GetByID(id string) (*models.Product, error)
	GetBySlug(slug string) (*models.Product, error)
	GetByCategory(category string) ([]models.Product, error)
	Save(p models.Product) error
	Update(p models.Product) error
	Delete(id string) error
}

type jsonProductRepo struct {
	store *storage.JSONStore[models.Product]
}

// NewProductRepository returns a JSON-backed ProductRepository.
func NewProductRepository(storageDir string) ProductRepository {
	return &jsonProductRepo{
		store: storage.NewJSONStore[models.Product](storageDir + "/products.json"),
	}
}

func (r *jsonProductRepo) GetAll() ([]models.Product, error) {
	return r.store.Read()
}

func (r *jsonProductRepo) GetByID(id string) (*models.Product, error) {
	products, err := r.store.Read()
	if err != nil {
		return nil, err
	}
	for i := range products {
		if products[i].ID == id {
			return &products[i], nil
		}
	}
	return nil, fmt.Errorf("product not found: %s", id)
}

func (r *jsonProductRepo) GetBySlug(slug string) (*models.Product, error) {
	products, err := r.store.Read()
	if err != nil {
		return nil, err
	}
	for i := range products {
		if products[i].Slug == slug {
			return &products[i], nil
		}
	}
	return nil, fmt.Errorf("product not found: %s", slug)
}

func (r *jsonProductRepo) GetByCategory(category string) ([]models.Product, error) {
	products, err := r.store.Read()
	if err != nil {
		return nil, err
	}
	var result []models.Product
	for _, p := range products {
		if p.Category == category && p.IsActive {
			result = append(result, p)
		}
	}
	return result, nil
}

func (r *jsonProductRepo) Save(p models.Product) error {
	products, err := r.store.Read()
	if err != nil {
		return err
	}
	products = append(products, p)
	return r.store.Write(products)
}

func (r *jsonProductRepo) Update(p models.Product) error {
	products, err := r.store.Read()
	if err != nil {
		return err
	}
	for i := range products {
		if products[i].ID == p.ID {
			products[i] = p
			return r.store.Write(products)
		}
	}
	return fmt.Errorf("product not found: %s", p.ID)
}

func (r *jsonProductRepo) Delete(id string) error {
	products, err := r.store.Read()
	if err != nil {
		return err
	}
	idx := -1
	for i, p := range products {
		if p.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return fmt.Errorf("product not found: %s", id)
	}
	products = append(products[:idx], products[idx+1:]...)
	return r.store.Write(products)
}
