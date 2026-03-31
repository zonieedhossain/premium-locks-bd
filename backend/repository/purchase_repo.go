package repository

import (
	"fmt"

	"premium-locks-bd/models"
	"premium-locks-bd/storage"
)

type PurchaseRepository interface {
	GetAll() ([]models.Purchase, error)
	GetByID(id string) (*models.Purchase, error)
	Save(p models.Purchase) error
	Update(p models.Purchase) error
	Delete(id string) error
}

type jsonPurchaseRepo struct {
	store *storage.JSONStore[models.Purchase]
}

func NewPurchaseRepository(storageDir string) PurchaseRepository {
	return &jsonPurchaseRepo{
		store: storage.NewJSONStore[models.Purchase](storageDir + "/purchases.json"),
	}
}

func (r *jsonPurchaseRepo) GetAll() ([]models.Purchase, error) {
	items, err := r.store.Read()
	if err != nil {
		return nil, err
	}
	if items == nil {
		return []models.Purchase{}, nil
	}
	return items, nil
}

func (r *jsonPurchaseRepo) GetByID(id string) (*models.Purchase, error) {
	items, err := r.store.Read()
	if err != nil {
		return nil, err
	}
	for i := range items {
		if items[i].ID == id {
			return &items[i], nil
		}
	}
	return nil, fmt.Errorf("purchase not found: %s", id)
}

func (r *jsonPurchaseRepo) Save(p models.Purchase) error {
	items, err := r.store.Read()
	if err != nil {
		return err
	}
	items = append(items, p)
	return r.store.Write(items)
}

func (r *jsonPurchaseRepo) Update(p models.Purchase) error {
	items, err := r.store.Read()
	if err != nil {
		return err
	}
	for i := range items {
		if items[i].ID == p.ID {
			items[i] = p
			return r.store.Write(items)
		}
	}
	return fmt.Errorf("purchase not found: %s", p.ID)
}

func (r *jsonPurchaseRepo) Delete(id string) error {
	items, err := r.store.Read()
	if err != nil {
		return err
	}
	for i, p := range items {
		if p.ID == id {
			items = append(items[:i], items[i+1:]...)
			return r.store.Write(items)
		}
	}
	return fmt.Errorf("purchase not found: %s", id)
}
