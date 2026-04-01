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
	GetByDateRange(from, to string) ([]models.Purchase, error)
}

type jsonPurchaseRepo struct {
	store *storage.PartitionedJSONStore[models.Purchase]
}

func NewPurchaseRepository(storageDir string) PurchaseRepository {
	return &jsonPurchaseRepo{
		store: storage.NewPartitionedJSONStore[models.Purchase](storageDir + "/purchases"),
	}
}

func (r *jsonPurchaseRepo) GetAll() ([]models.Purchase, error) {
	items, err := r.store.ReadAll()
	if err != nil {
		return nil, err
	}
	if items == nil {
		return []models.Purchase{}, nil
	}
	return items, nil
}

func (r *jsonPurchaseRepo) GetByID(id string) (*models.Purchase, error) {
	items, err := r.store.ReadAll()
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
	date := "unknown"
	if len(p.CreatedAt) >= 10 {
		date = p.CreatedAt[:10]
	}
	items, err := r.store.Read(date)
	if err != nil {
		return err
	}
	items = append(items, p)
	return r.store.Write(date, items)
}

func (r *jsonPurchaseRepo) Update(p models.Purchase) error {
	date := "unknown"
	if len(p.CreatedAt) >= 10 {
		date = p.CreatedAt[:10]
	}

	items, err := r.store.Read(date)
	if err != nil {
		return err
	}

	found := false
	for i := range items {
		if items[i].ID == p.ID {
			items[i] = p
			found = true
			break
		}
	}

	if !found {
		all, _ := r.store.ReadAll()
		for _, item := range all {
			if item.ID == p.ID {
				origDate := item.CreatedAt[:10]
				origItems, _ := r.store.Read(origDate)
				for j := range origItems {
					if origItems[j].ID == p.ID {
						origItems[j] = p
						return r.store.Write(origDate, origItems)
					}
				}
			}
		}
		return fmt.Errorf("purchase not found: %s", p.ID)
	}

	return r.store.Write(date, items)
}

func (r *jsonPurchaseRepo) Delete(id string) error {
	all, err := r.store.ReadAll()
	if err != nil {
		return err
	}

	foundDate := ""
	for _, p := range all {
		if p.ID == id {
			foundDate = p.CreatedAt[:10]
			break
		}
	}

	if foundDate == "" {
		return fmt.Errorf("purchase not found: %s", id)
	}

	items, err := r.store.Read(foundDate)
	if err != nil {
		return err
	}

	for i, p := range items {
		if p.ID == id {
			items = append(items[:i], items[i+1:]...)
			return r.store.Write(foundDate, items)
		}
	}

	return fmt.Errorf("purchase not found in partitioned file: %s", id)
}

func (r *jsonPurchaseRepo) GetByDateRange(from, to string) ([]models.Purchase, error) {
	items, err := r.store.ReadByRange(from, to)
	if err != nil {
		return nil, err
	}
	if items == nil {
		return []models.Purchase{}, nil
	}
	return items, nil
}
