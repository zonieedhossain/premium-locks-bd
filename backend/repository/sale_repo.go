package repository

import (
	"fmt"

	"premium-locks-bd/models"
	"premium-locks-bd/storage"
)

type SaleRepository interface {
	GetAll() ([]models.Sale, error)
	GetByID(id string) (*models.Sale, error)
	Save(s models.Sale) error
	Update(s models.Sale) error
	Delete(id string) error
}

type jsonSaleRepo struct {
	store *storage.JSONStore[models.Sale]
}

func NewSaleRepository(storageDir string) SaleRepository {
	return &jsonSaleRepo{
		store: storage.NewJSONStore[models.Sale](storageDir + "/sales.json"),
	}
}

func (r *jsonSaleRepo) GetAll() ([]models.Sale, error) {
	items, err := r.store.Read()
	if err != nil {
		return nil, err
	}
	if items == nil {
		return []models.Sale{}, nil
	}
	return items, nil
}

func (r *jsonSaleRepo) GetByID(id string) (*models.Sale, error) {
	items, err := r.store.Read()
	if err != nil {
		return nil, err
	}
	for i := range items {
		if items[i].ID == id {
			return &items[i], nil
		}
	}
	return nil, fmt.Errorf("sale not found: %s", id)
}

func (r *jsonSaleRepo) Save(s models.Sale) error {
	items, err := r.store.Read()
	if err != nil {
		return err
	}
	items = append(items, s)
	return r.store.Write(items)
}

func (r *jsonSaleRepo) Update(s models.Sale) error {
	items, err := r.store.Read()
	if err != nil {
		return err
	}
	for i := range items {
		if items[i].ID == s.ID {
			items[i] = s
			return r.store.Write(items)
		}
	}
	return fmt.Errorf("sale not found: %s", s.ID)
}

func (r *jsonSaleRepo) Delete(id string) error {
	items, err := r.store.Read()
	if err != nil {
		return err
	}
	for i, s := range items {
		if s.ID == id {
			items = append(items[:i], items[i+1:]...)
			return r.store.Write(items)
		}
	}
	return fmt.Errorf("sale not found: %s", id)
}
